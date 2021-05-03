import express, { application } from "express";

import Log from "server/logger";
import { sendError } from "server/util/send-error";
import SecretUtil from "./kube/secret-util";
import UserInstallation from "./github/user-app-installation";
import GitHubApp from "./github/gh-app";
import { GitHubUserType } from "common/types/github-types";

type UserMementoSaveable = {
  id: string,
  name: string,
  type: GitHubUserType,

  installedAppId?: string,
  installationId?: string,
}

type UserMemento = Omit<UserMementoSaveable, "id" | "appId" | "installationId"> & {
  id: number,

  installationInfo?: {
    appId: number,
    installationId: number,
  },
};

export default class User {
  private static readonly cache = new Map<number, User>();

  private _installation: UserInstallation | undefined;
  private _ownsAppId: number | undefined;

  private constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly type: GitHubUserType,
  ) {

    Log.info(`Creating ${type} reference to ${name}`);
  }

  public static async getUserForSession(req: express.Request, res: express.Response): Promise<User | undefined> {
    // this could probably be a middleware that attaches the user to the request obj
    if (!req.session.data?.githubUserId) {
      Log.warn(`No user session`)
      sendError(res, 400, "No user session provided");
      return undefined;
    }

    return this.loadUser(req.session.data.githubUserId);
  }

  public static async getInstallationForSession(req: express.Request, res: express.Response): Promise<UserInstallation | undefined> {
    const user = await this.getUserForSession(req, res);
    if (!user) {
      return undefined;
    }

    const installation = user.installation;

    if (!installation) {
      sendError(res, 400, `User "${user.name}" does not have an app installed.`);
      return undefined;
    }

    return installation;
  }

  public static async create(
    userInfo: { name: string, id: number, type: GitHubUserType },
    installationInfo?: { appId: number, installationId: number }
  ): Promise<User> {

    const user = new this(userInfo.id, userInfo.name, userInfo.type);
    if (installationInfo) {
      const app = await GitHubApp.load(installationInfo.appId);
      if (!app) {
        throw new Error(`User "${userInfo.name}" has app ${installationInfo.appId} installed, but that app could not be loaded`);
      }
      else {
        user.addInstallation(app, installationInfo.installationId, false);
      }
    }

    const apps = await GitHubApp.loadAll();

    if (apps == null) {
      Log.error(`${userInfo.name} just installed an app, but loading apps returned undefined`);
    }
    else if (apps.length === 0) {
      Log.error(`${userInfo.name} just installed an app, but 0 apps were loaded`);
    }

    apps?.forEach((app) => {
      if (app.ownerId === user.id) {
        Log.info(`${this.name} owns ${app.config.name}`);
        user._ownsAppId = app.id;
      }
    });

    await user.save();
    return user;
  }

  private async addInstallation(app: GitHubApp, installationId: number, save: boolean): Promise<void> {
    Log.info(`Add installation of ${app.config.name} to user ${this.name}`);
    this._installation = await UserInstallation.create(this, app, installationId);

    if (save) {
      await this.save();
    }
  }

  public async removeInstallation(): Promise<boolean> {
    if (this.installation) {
      Log.info(`Remove installation of ${this.installation.app.config.name} from ${this.name}`);
      this._installation = undefined;
      await this.save();
      return true;
    }
    return false;
  }

  private async save(): Promise<void> {
    Log.info(`Saving user ${this.name}`);
    const memento: UserMementoSaveable = {
      id: this.id.toString(),
      name: this.name,
      type: this.type,
    }

    if (this._installation) {
      memento.installedAppId = this._installation.app.config.id.toString();
      memento.installationId = this._installation.installationId.toString();
    }

    await SecretUtil.createSecret(User.getUserSecretName(this.id), memento, { subtype: SecretUtil.Subtype.USER });
    Log.info(`Update user ${this.name} data in cache`);
    User.cache.set(this.id, this);
  }

  private static async loadUser(userId: number): Promise<User | undefined> {
    if (User.cache.has(userId)) {
      Log.debug(`Loaded user data from cache`);
      return User.cache.get(userId);
    }

    const memento = await this.loadMemento(userId);
    if (!memento) {
      return undefined;
    }

    const user = await this.create(memento, memento.installationInfo);

    Log.info(`Loaded user ${memento.name}`);
    User.cache.set(userId, user);
    return user;
  }

  private static async loadMemento(
    userId: number
  ): Promise<UserMemento | undefined> {

    const secret = await SecretUtil.loadFromSecret<UserMementoSaveable>(User.getUserSecretName(userId));
    if (!secret) {
      return undefined;
    }

    const result: UserMemento = {
      id: Number(secret.data.id),
      name: secret.data.name,
      type: secret.data.type,
    };

    if (secret.data.installedAppId != null && secret.data.installationId != null) {
      result.installationInfo = {
        appId: Number(secret.data.installedAppId),
        installationId: Number(secret.data.installationId),
      }
    }

    return result;
  }

  private static getUserSecretName(userId: number) {
    return `github-user-${userId}`;
  }

  public get installation(): UserInstallation | undefined {
    return this._installation;
  }

  public get ownsAppId(): number | undefined {
    return this._ownsAppId;
  }
}
