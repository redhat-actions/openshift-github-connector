import express from "express";

import ApiEndpoints from "common/api-endpoints";
import { send405, sendError } from "server/util/send-error";
import { exchangeCodeForAppConfig } from "server/lib/github/gh-app-config";
import Log from "server/logger";
import { sendSuccessStatusJSON } from "server/util/server-util";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import GitHubApp from "server/lib/github/gh-app";
import User from "server/lib/user";
import { exchangeCodeForUserData } from "server/lib/github/gh-util";
import UserInstallation from "server/lib/github/gh-app-installation";
import StateCache from "server/lib/state-cache";

const router = express.Router();

const stateCache = new StateCache();

// const appsInProgress = new Map<string, { iat: number, ownerId: string, appId: string }>();

// .get(async (req, res, next) => {
//   const state = uuid();
//   creationsInProgress.set(state, { iat: Date.now() /* sessionID: req.sessionID */ });
//   const manifest = getAppManifest(getServerUrl(req, false), getClientUrl(req));

//   const resBody: ApiResponses.CreateAppResponse = {
//     manifest, state,
//   };

//   Log.info(`Heres the manifest`, manifest);

//   return res
//     // this page is not cached or you run into issues with state reuse if you use back/fwd buttons
//     .header(HttpConstants.Headers.CacheControl, "no-store")
//     .json(resBody);
// })

router.route(ApiEndpoints.Setup.SetCreateAppState.path)
  .post(async (req, res, next) => {
    const state: string | undefined = req.body.state;
    if (!state) {
      return sendError(res, 400, `Required parameter "state" missing from request body`);
    }

    stateCache.add(req.sessionID, req.body.state);

    return sendSuccessStatusJSON(res, 201);
  });

function createSessionSetupData(req: express.Request, appId: number): void {
  Log.info(`Saving session data`);

  req.session.setupData = {
    githubAppId: appId,
  };
}

router.route(ApiEndpoints.Setup.CreatingApp.path)
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
  .post(async (
    req: express.Request<any, any, ApiRequests.OAuthCallbackData>,
    res: express.Response<ApiResponses.CreatingAppResponse>,
    next
  ) => {
    const code = req.body.code;
    const state = req.body.state;

    if (!code) {
      return sendError(res, 400, `Required parameter "code" missing from request body`);
    }
    if (!state) {
      return sendError(res, 400, `Required parameter "state" missing from request body`);
    }

    if (!stateCache.validate(req.sessionID, state)) {
      return sendError(res, 400, `State parameter "${state}" is invalid or expired`);
    }

    const appConfig = await exchangeCodeForAppConfig(code);

    createSessionSetupData(req, appConfig.id);

    await GitHubApp.create({
      appId: appConfig.id,
      client_id: appConfig.client_id,
      client_secret: appConfig.client_secret,
      pem: appConfig.pem,
      webhook_secret: appConfig.webhook_secret,
    });

    Log.info(`Saved app ${appConfig.name} into secret`);

    const appInstallUrl = appConfig.html_url + "/installations/new";
    // const appInstallUrl = `https://github.com/settings/apps/${appConfig.slug}/installations`;

    // appsInProgress.set(req.sessionID, { iat: Date.now(), appId, ownerId });

    return res.json({
      success: true,
      message: `Successfully saved ${appConfig.name}`,
      appInstallUrl,
    });
  })
  .all(send405([ /* "GET", */ "POST" ]));

router.route(ApiEndpoints.Setup.PreInstallApp.path)
  .post(async (req: express.Request<any, any, ApiRequests.PreInstallApp>, res, next) => {
    createSessionSetupData(req, req.body.appId);
    return sendSuccessStatusJSON(res, 204);
  })
  .all(send405([ "POST" ]));

router.route(ApiEndpoints.Setup.PostInstallApp.path)
  .post(async (req: express.Request<any, any, ApiRequests.PostInstall>, res, next) => {
    // const appIdStr = req.body.appId;
    const installationIdStr = req.body.installationId;
    const oauthCode = req.body.oauthCode;
    const setupAction = req.body.setupAction;

    const installationId = Number(installationIdStr);
    if (Number.isNaN(installationId)) {
      return sendError(res, 400, `Installation ID "${installationId}" is not a number`);
    }

    const appId = req.session.setupData?.githubAppId;
    if (appId == null) {
      return sendError(res, 400, `No App ID for session. Please restart the app setup process.`);
    }

    const appInstalled = (await GitHubApp.load(appId));

    if (appInstalled == null) {
      return sendError(
        res, 500,
        `Failed to look up GitHub app "${appId}". Please restart the app setup process.`
      );
    }

    const userData = await exchangeCodeForUserData(
      appInstalled.config.client_id,
      appInstalled.config.client_secret,
      oauthCode
    );

    req.session.setupData = undefined;

    req.session.data = {
      githubUserId: userData.id,
    };

    const userInstallation = await UserInstallation.create(appInstalled, installationId);
    await User.create(userData.id, userData.login, userInstallation);

    return sendSuccessStatusJSON(res, 201);
  })
  .all(send405([ "POST" ]));

export default router;
