import { Octokit } from "@octokit/core";

import Log from "server/logger";
import {
  GitHubAppOwnerUrls,
  GitHubAppConfig,
  GitHubAppInstallationData,
  GitHubAppConfigNoSecrets,
  GitHubAppAuthData
} from "common/types/gh-types";
import SecretUtil from "server/lib/kube/secret-util";
import { getAppOctokit, getGitHubHostname } from "./gh-util";
import { fromb64, getFriendlyHTTPError } from "server/util/server-util";
import User from "server/lib/user/user";
import { loadAllActiveUsers } from "../user/user-serializer";
import { removeUndefined, toValidK8sName } from "common/common-util";

/**
 * The data we must save in order to be able to reconstruct this GitHub app.
 * This amounts to the secrets, so we can authenticate and retrieve the data
 * from the app api endpoint.
 */
interface AppMemento {
  [key: string]: string,

  id: string,
  name: string,
  // appName: string,
  // appSlug: string,

  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,

  // ownerId: number,
  authorizedUsers: string,
}

class GitHubApp {
  private static readonly cache = new Map<number, GitHubApp> ();

  public readonly urls: GitHubAppOwnerUrls;
  private readonly authorizedUsers: number[];

  private constructor(
    public readonly githubHostname: string,
    public readonly config: GitHubAppConfig,
    public readonly octokit: Octokit,
  ) {
    this.urls = {
      app: config.html_url,
      avatar: `https://${githubHostname}/identicons/app/app/${config.slug}`,
      newInstallation: config.html_url + "/installations/new",
      settings: `https://${githubHostname}/settings/apps/${config.slug}`,
      permissions: `https://${githubHostname}/settings/apps/${config.slug}/permissions`,
      ownerInstallations: `https://${githubHostname}/settings/apps/${config.slug}/installations`,
    };

    this.authorizedUsers = [this.config.owner.id];
  }

  private static async getAppConfig(octokit: Octokit): Promise<GitHubAppConfigNoSecrets> {
    Log.info(`Get app config`);
    return (await octokit.request("GET /app")).data as GitHubAppConfigNoSecrets;
  }

  public static async create(authData: GitHubAppAuthData): Promise<GitHubApp> {
    const octokit = getAppOctokit(authData);

    let configNoSecrets ;
    try {
      configNoSecrets = await this.getAppConfig(octokit);
    }
    catch (err) {
      if (err.response.status === 404) {

        throw new Error(
          `Received ${getFriendlyHTTPError(err)}; app has likely been deleted. `
          + `Delete the secret "${this.getAppSecretName(authData.id)}" to remove the app from the cluster.`
        );
      }
      throw err;
    }

    const config = {
      ...authData,
      ...configNoSecrets
    };

    const githubHostname = await getGitHubHostname();

    const app = new GitHubApp(
      githubHostname,
      config,
      octokit,
    );

    await app.save();

    return app;
  }

  public async save(): Promise<void> {
    const appId = this.config.id;

    const memento: AppMemento = {
      authorizedUsers: JSON.stringify(this.authorizedUsers),
      id: appId.toString(),
      name: this.config.name,
      // appSlug: this.config.slug,
      ownerId: this.config.owner.id.toString(),

      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      pem: this.config.pem,
      webhook_secret: this.config.webhook_secret,
    };

    // Log.debug("APP MEMENTO", memento);

    await SecretUtil.createSecret(
      SecretUtil.getSAClient(),
      GitHubApp.getAppSecretName(appId), memento, {
      "app.github.com/slug": toValidK8sName(this.config.slug),
      subtype: SecretUtil.Subtype.APP,
    });

    Log.info(`Saving app ${this.config.name} into cache`);
    GitHubApp.cache.set(appId, this);
  }

  public static async load(appId: number): Promise<GitHubApp | undefined> {
    Log.info(`Load app ID ${appId}`);
    const secretName = GitHubApp.getAppSecretName(appId)

    const cachedApp = GitHubApp.cache.get(appId);
    if (cachedApp) {
      Log.debug(`Loaded app data from cache`);
      return cachedApp;
    }

    const secret = await SecretUtil.loadFromSecret<AppMemento>(SecretUtil.getSAClient(), secretName);
    if (!secret) {
      Log.warn(`Tried to load app ${appId} from secret but it was not found`);
      return undefined;
    }

    const authorizedUsers = JSON.parse(secret.data.authorizedUsers);
    const appAuth = {
      ...secret.data,
      id: Number(secret.data.id),
      authorizedUsers,
    };

    const app = await GitHubApp.create(appAuth);

    const activeUsers = await loadAllActiveUsers();
    const owner = activeUsers.find((user) => user.githubUserInfo?.id === app.ownerId);
    if (owner) {
      owner.addOwnsApp(app);
    }

    app.save();

    return app;
  }

  public static async loadAll(): Promise<GitHubApp[] | undefined> {
    Log.info(`Load all apps`);
    const matchingSecrets = await SecretUtil.getSecretsMatchingSelector(
      SecretUtil.getSAClient(),
      SecretUtil.getSubtypeSelector(SecretUtil.Subtype.APP)
    );

    if (matchingSecrets.items.length === 0) {
      return undefined;
    }

    const appIds = removeUndefined(matchingSecrets.items.map((appSecret) => {
      const data = appSecret.data as AppMemento;
      const appId = data.id;

      if (appId) {
        const asNumber = Number(fromb64(appId));
        if (isNaN(asNumber)) {
          Log.error(`Secret ${appSecret.metadata?.name} contains a bad app ID ${appId}`)
          return undefined;
        }
        return asNumber;
      }
      Log.error(`Secret ${appSecret.metadata?.name} missing app ID`)
      return undefined;
    }));


    Log.info(`App IDs to be loaded are ${appIds.join(", ")}`);

    const apps = removeUndefined(
      await Promise.all(appIds.map((appId) => this.load(appId)))
    );

    return apps;
  }

  public async delete(requestingUser: User): Promise<void> {
    if (!requestingUser.ownsAppIds.includes(this.id)) {
      throw new Error(`User ${requestingUser} does not own app ${this.config.name}, and so cannot delete it.`);
    }

    GitHubApp.cache.delete(this.id);
    await SecretUtil.deleteSecret(SecretUtil.getSAClient(), GitHubApp.getAppSecretName(this.id), true);

    await requestingUser.onAppDeleted(this.id);
    // delete all installations, somehow
  }

  public async getInstallations(): Promise<GitHubAppInstallationData[]> {
    const installationsReq = this.octokit.request("GET /app/installations");
    const installations = (await installationsReq).data;
    return installations;
  }

  public get id(): number {
    return this.config.id;
  }

  public get ownerId(): number {
    return this.config.owner.id;
  }

  public get getWithoutSecrets(): GitHubAppConfigNoSecrets {
    const cfg: Partial<GitHubAppConfig> = { ...this.config };
    delete cfg.client_id;
    delete cfg.client_secret;
    delete cfg.pem;
    delete cfg.webhook_secret;

    return cfg as GitHubAppConfigNoSecrets;
  }

  public isUserAuthorized(userId: number): boolean {
    return this.authorizedUsers.includes(userId);
  }

  private static getAppSecretName(appId: number) {
    return `github-app-${appId}`;
  }
}

export default GitHubApp;
