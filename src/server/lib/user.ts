import express from "express";

import Log from "server/logger";
import { sendError } from "server/util/send-error";
import SecretUtil from "./kube/secret-util";
import UserInstallation from "./github/gh-app-installation";
import GitHubApp from "./github/gh-app";

type UserMemento = {
  [key: string]: number | string | undefined,

  userId: number,
  userName: string,

  appId?: number,
  installationId?: number,
}

type UserMementoSaveable = {
  [key: string]: string | undefined,

  userId: string,
  userName: string,

  appId?: string,
  installationId?: string,
}

export default class User {

  // [key: string]: number | string | {} | undefined;

  private static readonly cache = new Map<number, User>();

  public readonly ownsAppId?: number;

  private constructor(
    public readonly userId: number,
    public readonly userName: string,

    private _installation?: UserInstallation,
  ) {

    const ownerId = _installation?.app.config.owner.id;
    if (_installation && ownerId === userId) {
      this.ownsAppId = _installation.app.config.id;
    }
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
      sendError(res, 400, `User "${user.userName}" does not have an app installed.`);
      return undefined;
    }

    return installation;
  }

  public get installation(): UserInstallation | undefined {
    return this._installation;
  }

  public static async create(userId: number, userName: string, installation?: UserInstallation): Promise<User> {
    const user = new User(userId, userName, installation);
    await user.save();
    return user;
  }

  public async save(): Promise<void> {
    const memento: NonNullable<UserMementoSaveable> = {
      userId: this.userId.toString(),
      userName: this.userName,
    }

    if (this._installation) {
      memento.appId = this._installation.app.config.id.toString();
      memento.installationId = this._installation.installationId.toString();
    }

    await SecretUtil.createSecret(User.getUserSecretName(this.userId), memento, { subtype: SecretUtil.Subtype.USER });
    Log.info(`Update user data in cache`);
    User.cache.set(this.userId, this);
  }

  public static async loadUser(userId: number): Promise<User | undefined> {
    if (User.cache.has(userId)) {
      Log.debug(`Loaded user data from cache`);
      return User.cache.get(userId);
    }

    const memento = await this.loadMemento(userId);
    if (!memento) {
      return undefined;
    }

    const userApp = await this.getAppForUser(memento);
    const user = new User(memento.userId, memento.userName, userApp);
    Log.info(`Loaded user ${memento.userName}`);
    User.cache.set(userId, user);
    return user;
  }

  private static async loadMemento(userId: number): Promise<UserMemento | undefined> {
    const secret = await SecretUtil.loadFromSecret<UserMementoSaveable>(User.getUserSecretName(userId));
    if (!secret) {
      return undefined;
    }

    const memento: UserMemento = {
      userId: Number(secret.data.userId),
      userName: secret.data.userName,
      appId: secret.data.appId ? Number(secret.data.appId) : undefined,
      installationId: secret.data.installationId ? Number(secret.data.installationId) : undefined,
    };

    Object.entries(memento).forEach(([ k, v ]) => {
      if (Number.isNaN(v)) {
        Log.error(`After loading secret for user "${memento.userName}", entry "${k}" is NaN!`);
      }
    });

    return memento;
  }

  private static getUserSecretName(userId: number) {
    return `github-user-${userId}`;
  }

  private static async getAppForUser(userMemento: UserMemento): Promise<UserInstallation | undefined> {
    const user = await User.loadMemento(userMemento.userId);
    if (!user) {
      Log.info(`No user data for session`);
      return undefined;
    }
    else if (!user.appId) {
      Log.info(`User has no app bound`);
      return undefined;
    }
    else if (!user.installationId) {
      Log.info(`User has app bound, but not installed`);
      return undefined;
    }

    const app = await GitHubApp.load(user.appId);

    if (!app) {
      Log.warn(`User ${user.userId} tried to load app ${user.appId} but it was not found`);
      return undefined;
    }
    else if (!app.isUserAuthorized(user.userId)) {
      Log.warn(`User ${user.userId} is not authorized to access app ${app.config.id}`);
      return undefined;
    }

    const appInstallation = await UserInstallation.create(app, user.installationId);
    Log.info(`Successfully created app installation instance for ${userMemento.userName}`);
    return appInstallation;
  }
}
