import * as k8s from "@kubernetes/client-node";

import Log from "server/logger";
import ImageRegistryListWrapper from "server/lib/user/image-registry-list";
import {
  AddGitHubAppInstallationInfo, UserSessionData,
} from "./server-user-types";
import UserInstallation from "../github/user-app-installation";
import GitHubApp from "../github/gh-app";
import { ConnectorGitHubUserInfo, ConnectorUserInfo, OpenShiftUserInfo } from "common/types/user-types";
import TokenUtil from "./token-util";
import KubeWrapper from "../kube/kube-wrapper";
import UserSerializer from "./user-serializer";
import GitHubAppSerializer from "../github/gh-app-serializer";

/**
 * This is the User type, but githubUserInfo must be defined.
 */
export interface UserWithGitHubInfo extends User {
  githubUserInfo: ConnectorGitHubUserInfo,
};

export default class User {
  /**
  * User's OpenShift username
  */
  public readonly name: string;
  /**
  * User's OpenShift UID
  */
  public readonly uid: string;
  /**
  * If the user has permissions to administrate the Connector
  */
  public readonly isAdmin: boolean;

  public readonly imageRegistries: ImageRegistryListWrapper;

  private _installingAppId: number | undefined;

  private _githubUserInfo: ConnectorGitHubUserInfo | undefined;
  private _installation: UserInstallation | undefined;
  private _ownsAppIds: number[] = [];

  protected constructor(
    private readonly token: TokenUtil.TokenInfo,
    openshiftUserInfo: OpenShiftUserInfo,
    imageRegistryListStr: string | undefined,
  ) {
    this.name = openshiftUserInfo.name;
    this.uid = openshiftUserInfo.uid;
    this.isAdmin = openshiftUserInfo.isAdmin;

    Log.info(`Creating user ${this.name}. isAdmin=${this.isAdmin}`);

    this.imageRegistries = new ImageRegistryListWrapper(async () => {
      await UserSerializer.save(this).catch((err) => Log.error(`Error saving user ${this.name} on image registry change:`, err));
    }, imageRegistryListStr);
  }

  /**
   * Get the app installation tied to the user identified by the session cookie.
   * If this returns undefined, the route handler must abort the request, since a response will have been sent.
   */
  /*
  public static async getInstallationForSession(req: express.Request, res: express.Response): Promise<UserInstallation | undefined> {
    const user = req.user;
    if (!user) {
      res.sendError(401, `Authentication required`);
      return undefined;
    }

    const installation = user._installation;

    if (!installation) {
      res.sendError(400, `User "${user.name}" does not have an app installed.`);
      return undefined;
    }

    return installation;
  }
  */

  public static async loadOrCreate(
    userSessionData: UserSessionData,
  ): Promise<User> {
		const loaded = await UserSerializer.load(userSessionData);
		if (loaded) {
			return loaded;
		}

		return this.create(userSessionData.token, userSessionData.info);
  }

	public static async create(
		token: TokenUtil.TokenInfo,
    openshiftUserInfo: OpenShiftUserInfo,
    imageRegistryListStr?: string,
		githubUserInfo?: ConnectorGitHubUserInfo,
		installationInfo?: AddGitHubAppInstallationInfo,
	): Promise<User> {

		const user = new this(token, openshiftUserInfo, imageRegistryListStr);

    if (githubUserInfo) {
      await user.addGitHubUserInfo(githubUserInfo, false);

      if (installationInfo) {
        await user.addInstallation(installationInfo, false);
      }
      else {
        Log.info(`User ${openshiftUserInfo.name} does not have an installation.`);
      }
    }
    else {
      Log.info(`No GitHub info for user ${user.name}`);
      if (installationInfo) {
        Log.error(`Installation info provided for user ${user.name}, but no GitHub user info provided`);
      }
    }

		await UserSerializer.save(user);

		return user;
	}

  public async onAppDeleted(appId: number): Promise<void> {
    if (this.installation?.app.id === appId) {
      await this.removeInstallation();
    }

    const ownedAppIndex = this._ownsAppIds.findIndex((id) => id === appId);
    if (ownedAppIndex !== -1) {
      Log.info(`Remove ${appId} from ${this.name} owned apps`);
      this._ownsAppIds.splice(ownedAppIndex, 1);
    }
  }

  public startInstallingApp(appId: number): void {
    Log.info(`user ${this.uid} is installing appId ${appId}`);
    this._installingAppId = appId;
  }

  public getInstallingApp(): number | undefined {
    const installatingAppId = this._installingAppId;
    Log.info(`user ${this.uid} is FINISHED installing appId ${installatingAppId}`);
    this._installingAppId = undefined;
    return installatingAppId;
  }

  public async addGitHubUserInfo(githubUserInfo: ConnectorGitHubUserInfo, save: boolean): Promise<void> {
    this._githubUserInfo = githubUserInfo;
    Log.info(`User ${this.name} is GitHub ${this._githubUserInfo.type} ${this._githubUserInfo.name}`);

    await this.refreshOwnedApps();

    if (save) {
      await UserSerializer.save(this);
    }
  }

  private async refreshOwnedApps(): Promise<void> {
    Log.info(`Checking if ${this.name} owns any GitHub apps`);
    const apps = await GitHubAppSerializer.loadAll();

    // see if user owns any apps
    apps?.forEach((app) => {
      if (app.ownerId === this.githubUserInfo?.id) {
        Log.info(`${this.name} owns ${app.config.name}`);
        this._ownsAppIds.push(app.id);
      }
    });
  }

  public addOwnsApp(app: GitHubApp): void {
    if (!this.githubUserInfo) {
      Log.error(`Tried to add owned app ${app.config.name} with ID ${app.config.id} to user ${this.name}, `
        + `but user's GitHub info was null`);
      return;
    }
    else if (app.ownerId !== this.githubUserInfo.id) {
      Log.error(`Tried to add owned app ${app.config.name} with ID ${app.config.id} to user ${this.name}, `
        + `but owner ID ${app.ownerId} does not match github user ID ${this.githubUserInfo?.id}`)
      return;
    }
    else if (this.ownsAppIds.includes(app.id)) {
      Log.info(`User ${this.name} already owns app ${app.config.name}`);
      return;
    }

    Log.info(`${this.name} owns ${app.config.name}`);
    this.ownsAppIds.push(app.id);
  }

  public async addInstallation(installationInfo: AddGitHubAppInstallationInfo, save: boolean): Promise<void> {
    Log.info(`Add installation ${installationInfo.installationId} of app ID ${installationInfo.appId} to user ${this.name}`);
    const app = await GitHubAppSerializer.load(installationInfo.appId);
    if (!app) {
      // this can happen if the app secret is deleted.
      const errMsg = `User "${this.name}" has app ${installationInfo.appId} installed, `
        + `but that app could not be loaded. Removing installation reference.`;
      Log.warn(errMsg);

      await this.removeInstallation();
      // throw new Error(errMsg);
      return;
    }

    Log.info(`Add installation of ${app.config.name} to user ${this.name}`);

    if (this.githubUserInfo == null) {
      // this can happen if the install-setup failed.
      const errMsg = `Failed to add installation to user ${this.name}: GitHub info not defined for user. Removing installation reference.`;
      Log.warn(errMsg);

      await this.removeInstallation();
      // throw new Error(errMsg);
      return;
    }

    const thisWithGitHubInfo = this as UserWithGitHubInfo;

    this._installation = await UserInstallation.create(thisWithGitHubInfo, app, installationInfo.installationId);

    if (save) {
      await UserSerializer.save(this);
    }
  }

  public async removeInstallation(): Promise<boolean> {
    if (this.installation) {
      Log.info(`Remove installation of ${this.installation.app.config.name} from ${this.name}`);
      this._installation = undefined;
      await UserSerializer.save(this);
      return true;
    }
    return false;
  }

  public get sessionData(): UserSessionData {
    return {
      info: {
        isAdmin: this.isAdmin,
        name: this.name,
        uid: this.uid,
      },
      token: this.token,
    };
  }

  public get allInfo(): ConnectorUserInfo {
    return {
      ...this.openshiftUserInfo,
      githubInfo: this.githubUserInfo,
      githubInstallationInfo: this.installation?.info,
      ownsAppIds: this.ownsAppIds,
      hasCompletedSetup: this.installation != null || this.ownsAppIds.length > 0,
    };
  }

  public get openshiftUserInfo(): OpenShiftUserInfo {
    return {
      isAdmin: this.isAdmin,
      name: this.name,
      uid: this.uid,
    };
  }

  public get githubUserInfo(): ConnectorGitHubUserInfo | undefined {
    return this._githubUserInfo;
  }

  public get installation(): UserInstallation | undefined {
    return this._installation;
  }

  public get ownsAppIds(): number[] {
    return this._ownsAppIds;
  }

  public makeKubeConfig(): k8s.KubeConfig {
    const config = new k8s.KubeConfig();
    config.loadFromClusterAndUser(KubeWrapper.instance.cluster, {
      name: this.name,
      token: this.token.accessToken,
    });

    return config;
  }

  public makeCoreV1Client(): k8s.CoreV1Api {
    return this.makeKubeConfig().makeApiClient(k8s.CoreV1Api);
  }
}
