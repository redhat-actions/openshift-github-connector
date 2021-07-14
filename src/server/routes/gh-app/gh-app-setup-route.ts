import express from "express";

import ApiEndpoints from "common/api-endpoints";
import { exchangeCodeForAppConfig } from "server/lib/github/gh-app-config";
import Log from "server/logger";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import { exchangeCodeForUserData } from "server/lib/github/gh-util";
import StateCache from "server/lib/state-cache";
import { send405 } from "server/express-extends";
import { GitHubUserType } from "common/types/gh-types";
import GitHubAppSerializer from "server/lib/github/gh-app-serializer";

const router = express.Router();

const stateCache = new StateCache();

router.route(ApiEndpoints.Setup.SetCreateAppState.path)
  .post(async (req, res, next) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const state: string | undefined = req.body.state;
    if (!state) {
      return res.sendError(400, `Required parameter "state" missing from request body`);
    }

    stateCache.add(user.uid, req.body.state);

    return res.sendStatus(201);
  });

router.route(ApiEndpoints.Setup.CreatingApp.path)
  .post(async (
    req: express.Request<any, any, ApiRequests.GitHubOAuthCallbackData>,
    res: express.Response<ApiResponses.CreatingAppResponse>,
    next
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const code = req.body.code;
    const state = req.body.state;

    if (!code) {
      return res.sendError(400, `Required parameter "code" missing from request body`);
    }
    if (!state) {
      return res.sendError(400, `Required parameter "state" missing from request body`);
    }

    if (!stateCache.validate(user.uid, state)) {
      return res.sendError(400, `State parameter "${state}" is invalid or expired`);
    }

    const appConfig = await exchangeCodeForAppConfig(code);

    user.startInstallingApp(appConfig.id);

    await GitHubAppSerializer.create(appConfig);

    Log.info(`Saved app ${appConfig.name} into secret`);

    const appInstallUrl = appConfig.html_url + "/installations/new";
    // const appInstallUrl = `https://github.com/settings/apps/${appConfig.slug}/installations`;

    return res.json({
      success: true,
      message: `Successfully saved ${appConfig.name}`,
      appInstallUrl,
      appName: appConfig.name,
    });
  })
  .all(send405([ /* "GET", */ "POST" ]));

router.route(ApiEndpoints.Setup.PreInstallApp.path)
  .post(async (req: express.Request<any, any, ApiRequests.PreInstallApp>, res, next) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    user.startInstallingApp(req.body.appId);
    return res.sendStatus(204);
  })
  .all(send405([ "POST" ]));

router.route(ApiEndpoints.Setup.PostInstallApp.path)
  .post(async (req: express.Request<any, any, ApiRequests.PostInstall>, res, next) => {
    // const appIdStr = req.body.appId;
    const installationIdStr = req.body.installationId;
    const oauthCode = req.body.oauthCode;
    // const setupAction = req.body.setupAction;

    Log.info(`Post-install`);

    const installationId = Number(installationIdStr);
    if (Number.isNaN(installationId)) {
      return res.sendError(400, `Installation ID "${installationId}" is not a number`);
    }

    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const appId = user.getInstallingApp();
    if (appId == null) {
      return res.sendError(400, `Missing new installation app ID. Please restart the app installation process.`);
    }

    Log.info(`Post install is for app ${appId}`);

    const appInstalled = await GitHubAppSerializer.load(appId);

    if (appInstalled == null) {
      return res.sendError(500, `Failed to look up GitHub app "${appId}". Please restart the app setup process.`);
    }

    if (!appInstalled.config.client_id || !appInstalled.config.client_secret) {
      throw new Error(`Failed to load OAuth data for app ${appInstalled.config.name}`);
    }

    const userData = await exchangeCodeForUserData(
      appInstalled.config.client_id,
      appInstalled.config.client_secret,
      oauthCode,
    );

    await user.addGitHubUserInfo({
      id: userData.id,
      name: userData.login,
      type: userData.type as GitHubUserType,
    }, true);
    await user.addInstallation({ appId, installationId }, true);

    return res.sendStatus(201);
  })
  .all(send405([ "POST" ]));

export default router;

/*
  .get(async (req, res, next) => {
    const memento = await GitHubAppMemento.tryLoad(req.sessionID);
    if (!memento) {
      return sendError(
        res, 400,
        `No GitHub app secret saved for your session. Please restart the app setup process.`
      );
    }

    // const appWithoutInstallID = await GitHubApp.getApp(memento);
    // const appConfig = await GitHubApp.getAppConfig(appWithoutInstallID);

    const app = await GitHubApp.getAppForSession(req.sessionID);
    if (!app) {
      return sendError(
        res, 400,
        `No GitHub app secret saved for your session. Please restart the app setup process.`
      );
    }
    const appConfig = app.config;

    const appWithSecrets: GitHubAppConfigWithSecrets = {
      ...appConfig,
      client_id: memento.client_id,
      client_secret: memento.client_secret,
      pem: memento.privateKey,
      webhook_secret: memento.webhook_secret,
    };

    if (req.headers.accept?.startsWith("application/json")) {
      return res.json(appWithSecrets);
    }

    const filename = appConfig.slug + ".json";
    // https://github.com/eligrey/FileSaver.js/wiki/Saving-a-remote-file#using-http-header
    res.setHeader(HttpConstants.Headers.ContentType, "application/octet-stream; charset=utf-8");
    res.setHeader(
      HttpConstants.Headers.ContentDisposition,
      `attachment; filename="${filename}"; filename*="${filename}"`
    );
    const appWSecretsString = JSON.stringify(appWithSecrets);
    res.setHeader(HttpConstants.Headers.ContentLength, Buffer.byteLength(appWSecretsString, "utf8"));

    return res.send(appWSecretsString);
  })
  */
