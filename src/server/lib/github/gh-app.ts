import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "server/logger";
import { GitHubAppOwnerUrls, GitHubAppConfig, GitHubAppInstallationData, GitHubAppConfigNoSecrets } from "common/types/github-types";
import SecretUtil from "server/lib/kube/secret-util";
import { getGitHubHostname } from "./gh-util";
import { toValidK8sName } from "server/util/server-util";

/**
 * The data we must save in order to be able to reconstruct this GitHub app.
 * This amounts to the secrets, so we can authenticate and retrieve the data
 * from the app api endpoint.
 */
interface AppMemento {
  appId: number,

  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,
}

/**
 * A version of the AppMemento that we end up actually saving into the secret
 */
interface AppMementoSaveable extends AppMemento {
  [key: string]: string | number,

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
      settings: `https://${githubHostname}/settings/apps/${config.slug}`,
      permissions: `https://${githubHostname}/settings/apps/${config.slug}/permissions`,
      installations: `https://${githubHostname}/settings/apps/${config.slug}/installations`,
    };

    this.authorizedUsers = [this.config.owner.id];
  }

  private static async getApp(appData: AppMemento): Promise<App> {
    return new App({
      appId: appData.appId,
      privateKey: appData.pem,
      // oauth: {
      // clientId: appConfig.client_id,
      // clientSecret: appConfig.client_secret,
      // },
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
    const memento: AppMementoSaveable = {
      appId: this.config.id,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      pem: this.config.pem,
      webhook_secret: this.config.webhook_secret,
      ownerId: this.config.owner.id,
      authorizedUsers: JSON.stringify(this.authorizedUsers),
    };

    await SecretUtil.createSecret(GitHubApp.getAppSecretName(memento.appId), memento, {
      appSlug: toValidK8sName(this.config.slug),
      subtype: "app"
    });

    Log.info(`Saving app ${this.config.name} into cache after creating`);
    GitHubApp.cache.set(memento.appId, this);
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
