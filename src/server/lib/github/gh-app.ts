import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "server/logger";
import { GitHubAppOwnerUrls, GitHubAppConfig, GitHubAppInstallationData, GitHubAppConfigNoSecrets } from "common/types/github-types";
import SecretUtil from "server/lib/kube/secret-util";
import { getGitHubHostname } from "./gh-util";
import { fromb64, toValidK8sName } from "server/util/server-util";

/**
 * The data we must save in order to be able to reconstruct this GitHub app.
 * This amounts to the secrets, so we can authenticate and retrieve the data
 * from the app api endpoint.
 */
interface AppMemento {
  appId: number,
  // appName: string,
  // appSlug: string,

  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,
}

/**
 * A version of the AppMemento that we end up actually saving into the secret
 */
interface AppMementoSaveable {
  [key: string]: string,

  appId: string,
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

  private static async getApp(appData: AppMemento): Promise<App> {
    return new App({
      appId: appData.appId,
      privateKey: appData.pem,
      oauth: {
        clientId: appData.client_id,
        clientSecret: appData.client_secret,
      },
      webhooks: {
        secret: appData.webhook_secret,
      },
      log: Log,
    });
  }

  private static async getAppConfig(ghApp: App): Promise<GitHubAppConfigNoSecrets> {
    return (await ghApp.octokit.request("GET /app")).data as GitHubAppConfigNoSecrets;
  }

  public static async create(appData: AppMemento): Promise<GitHubApp> {
    const ghAppObj = await this.getApp(appData);
    const configNoSecrets = await this.getAppConfig(ghAppObj);
    const config = {
      ...appData,
      ...configNoSecrets
    };

    const githubHostname = await getGitHubHostname();

    const app = new GitHubApp(
      githubHostname,
      config,
      ghAppObj.octokit,
    );

    await app.save();

    return app;
  }

  public async save(): Promise<void> {
    const appId = this.config.id;

    const memento: AppMementoSaveable = {
      authorizedUsers: JSON.stringify(this.authorizedUsers),
      appId: appId.toString(),
      // appName: this.config.name,
      // appSlug: this.config.slug,
      ownerId: this.config.owner.id.toString(),

      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      pem: this.config.pem,
      webhook_secret: this.config.webhook_secret,
    };

    await SecretUtil.createSecret(GitHubApp.getAppSecretName(appId), memento, {
      appSlug: toValidK8sName(this.config.slug),
      subtype: SecretUtil.Subtype.APP,
    });

    Log.info(`Saving app ${this.config.name} into cache after creating`);
    GitHubApp.cache.set(appId, this);
  }

  public static async load(appId: number): Promise<GitHubApp | undefined> {
    const secretName = GitHubApp.getAppSecretName(appId)

    let app = GitHubApp.cache.get(appId);
    if (!app) {
      const secret = await SecretUtil.loadFromSecret<AppMementoSaveable>(secretName);
      if (!secret) {
        Log.warn(`Tried to load app ${appId} from secret but it was not found`);
        return undefined;
      }

      const authorizedUsers = JSON.parse(secret.data.authorizedUsers);
      const memento = {
        ...secret.data,
        appId: Number(secret.data.appId),
        authorizedUsers,
      };

      app = await GitHubApp.create(memento);

      Log.info(`Saving app ${app.config.name} into cache after loading`);
      GitHubApp.cache.set(appId, app);
    }
    else {
      Log.debug(`Loaded app data from cache`);
    }

    return app;
  }

  public static async loadAll(): Promise<GitHubApp[] | undefined> {
    const selector = "subtype=" + SecretUtil.Subtype.APP;
    const matchingSecrets = await SecretUtil.getSecretsMatchingSelector(selector);

    if (matchingSecrets.items.length === 0) {
      return undefined;
    }

    const appIds = matchingSecrets.items.map((appSecret) => {
      const appId = appSecret?.data?.appId;

      if (appId) {
        const asNumber = Number(fromb64(appId));
        if (isNaN(asNumber)) {
          return undefined;
        }
        return asNumber;
      }
      return undefined;
    }).reduce((result: number[], appId: number | undefined) => {
        // remove undefined
        if (appId != null) {
          result.push(appId);
        }
        return result;
      }, []);

    const apps = (await Promise.all(appIds.map((appId) => this.load(appId))))
      .reduce((result: GitHubApp[], app: GitHubApp | undefined) => {
        // remove undefined
        if (app != null) {
          result.push(app);
        }
        return result;
      }, [])

    return apps;
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

  public isUserAuthorized(userId: number): boolean {
    return this.authorizedUsers.includes(userId);
  }

  public async delete(): Promise<void> {
    // const app = GitHubApp.load();
    // if (!app) {
    //   return;
    // }

    // GitHubApp.cache.delete(appId);
    // await SecretUtil.deleteSecret(getAppSecretName(appId), true);
  }

  private static getAppSecretName(appId: number) {
    return `github-app-${appId}`;
  }
}

export default GitHubApp;
