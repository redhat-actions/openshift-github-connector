import Log from "server/logger";
import ImageRegistryListWrapper from "server/lib/user/image-registry-list";
import {
  AddGitHubAppInstallationInfo, UserSessionData,
} from "./server-user-types";
import { loadUser, saveUser } from "./user-serializer";
import UserInstallation from "../github/user-app-installation";
import GitHubApp from "../github/gh-app";
import { ConnectorUserInfo, GitHubUserInfo, OpenShiftUserInfo } from "common/types/user-types";
import TokenUtil from "./token-util";

/**
 * This is the User type, but githubUserInfo must be defined.
 */
export interface UserWithGitHubInfo extends User {
  githubUserInfo: GitHubUserInfo
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

  private _githubUserInfo: GitHubUserInfo | undefined;
  private _installation: UserInstallation | undefined;
  private _ownsAppId: number | undefined;

  protected constructor(
    private readonly token: TokenUtil.TokenInfo,
    openshiftUserInfo: OpenShiftUserInfo,
    imageRegistryListStr: string | undefined,
    githubUserInfo?: GitHubUserInfo,
  ) {
    this.name = openshiftUserInfo.name;
    this.uid = openshiftUserInfo.uid;
    this.isAdmin = openshiftUserInfo.isAdmin;

    Log.info(`Creating user ${this.name}. isAdmin=${this.isAdmin}`);

    this.imageRegistries = new ImageRegistryListWrapper(async () => {
      await saveUser(this).catch((err) => Log.error(`Error saving user ${this.name}:`, err));
    }, imageRegistryListStr);

    if (githubUserInfo) {
      this.addGitHubUserInfo(githubUserInfo, false);
    }
    else {
      Log.info(`No GitHub info for user ${this.name}`);
    }
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
		const loaded = await loadUser(userSessionData);
		if (loaded) {
			return loaded;
		}

		return this.create(userSessionData.token, userSessionData.info);
  }

	public static async create(
		token: TokenUtil.TokenInfo,
    openshiftUserInfo: OpenShiftUserInfo,
    imageRegistryListStr?: string,
		githubUserInfo?: GitHubUserInfo,
		installationInfo?: AddGitHubAppInstallationInfo,
	): Promise<User> {

		const user = new this(token, openshiftUserInfo, imageRegistryListStr, githubUserInfo);

		if (installationInfo) {
      await user.addInstallation(installationInfo, false);
    }

    /*
    const apps = await GitHubApp.loadAll();

    // see if user owns any apps
    apps?.forEach((app) => {
      if (app.ownerId === user.githubUserInfo?.id) {
        Log.info(`${user.name} owns ${app.config.name}`);
        user._ownsAppId = app.id;
      }
    });
    */

		await saveUser(user);

		return user;
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

  public async addGitHubUserInfo(githubUserInfo: GitHubUserInfo, save: boolean): Promise<void> {
    this._githubUserInfo = githubUserInfo;
    Log.info(`User ${this.name} is GitHub ${this._githubUserInfo.type} ${this._githubUserInfo.name}`);

    if (save) {
      await saveUser(this);
    }
  }

  public async addInstallation(installationInfo: AddGitHubAppInstallationInfo, save: boolean): Promise<void> {
    const app = await GitHubApp.load(installationInfo.appId);
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
      await saveUser(this);
    }
  }

  public async removeInstallation(): Promise<boolean> {
    if (this.installation) {
      Log.info(`Remove installation of ${this.installation.app.config.name} from ${this.name}`);
      this._installation = undefined;
      await saveUser(this);
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
    };
  }

  public get openshiftUserInfo(): OpenShiftUserInfo {
    return {
      isAdmin: this.isAdmin,
      name: this.name,
      uid: this.uid,
    };
  }

  public get githubUserInfo(): GitHubUserInfo | undefined {
    return this._githubUserInfo;
  }

  public get installation(): UserInstallation | undefined {
    return this._installation;
  }

  public get ownsAppId(): number | undefined {
    return this._ownsAppId;
  }
}
