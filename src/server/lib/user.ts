import express from "express";

import Log from "server/logger";
import { sendError } from "server/util/send-error";
import SecretUtil, { SimpleValue } from "./kube/secret-util";
import UserInstallation from "./github/gh-app-installation";
import GitHubApp from "./github/gh-app";

type UserMemento = {
  [key: string]: SimpleValue,
  [key: number]: SimpleValue,

  userId: number,
  userName: string,

  appId?: number,
  installationId?: number,
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

    if (_installation && _installation.app.config.owner.id === userId) {
      this.ownsAppId = _installation.app.config.id;
    }
  }

  public static async getUserForSession(req: express.Request, res: express.Response): Promise<User | undefined> {
    // this could probably be a middleware that attaches the user to the request obj
    if (!req.session.data?.githubUserId) {
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

    return user.installation;
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
    const memento: NonNullable<UserMemento> = {
      userId: this.userId,
      userName: this.userName,
    }

    if (this._installation) {
      memento.appId = this._installation.app.config.id;
      memento.installationId = this._installation.installationId;
    }

    await SecretUtil.createSecret(User.getUserSecretName(this.userId), memento, { subtype: "user" });
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
    const secret = await SecretUtil.loadFromSecret<UserMemento>(User.getUserSecretName(userId));
    if (!secret) {
      return undefined;
    }

    const memento = secret.data;

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
