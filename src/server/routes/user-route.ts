import express from "express";

import ApiEndpoints from "common/api-endpoints";
import { send405, sendError } from "server/util/send-error";
import ApiResponses from "common/api-responses";
import User from "server/lib/user";

const router = express.Router();

/*
const stateCache = new StateCache();

router.route(ApiEndpoints.User.SetUserOAuthState.path)
  .post(async (req: express.Request<void, any, ApiRequests.CreateCallbackStateWithAppID>, res, next) => {
    const state = req.body.state;
    if (!state) {
      return sendError(res, 400, `Required parameter "state" missing from request body`);
    }

    stateCache.add(req.sessionID, req.body.state);

    return sendSuccessStatusJSON(res, 201);
  });

router.route(ApiEndpoints.User.PostUserOAuth.path)
  .post(async (
    req: express.Request<void, any, ApiRequests.OAuthCallbackData>,
    res: express.Response<GitHubUserData>,
    next
  ) => {

    const state = req.body.state;
    const oauthCode = req.body.code;

    if (!stateCache.validate(req.sessionID, state)) {
      return sendError(res, 400, `State parameter "${state}" is invalid or expired. Please try to log in again.`);
    }

    const appId = req.session.creatingAppData?.githubAppId;

    if (appId == null) {
      return sendError(res, 400, `App ID not provided in session cookie. Please try to log in again.`);
    }

    const appData = await GitHubApp.load(appId);
    if (!appData) {
      return sendError(res, 500, `App with ID "${appId}" is not set up.`);
    }

    const userData = await exchangeCodeForUserData(appData.config.client_id, appData.config.client_secret, oauthCode);

    req.session.creatingAppData = undefined;

    req.session.data = {
      githubUserId: userData.id,
    };

    await User.create(userData.id, userData.login);

    return res.json(userData);
  });

  */

router.route(ApiEndpoints.User.Root.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.GitHubUserResponse>,
    next,
  ) => {
    const installation = await User.getInstallationForSession(req, res);
    if (!installation) {
      return undefined;
    }

    const githubUserDataRes = await installation.octokit.request("GET /app/installations/{installation_id}", {
      // eslint-disable-next-line camelcase
      installation_id: installation.installationId,
    });

    const userData = githubUserDataRes.data.account;
    if (userData == null) {
      return sendError(res, 500, "GitHub responded with empty user info");
    }
    const resBody = userData as ApiResponses.GitHubUserResponse;

    return res.json(resBody);
  })
  // .post(async (
  //   req: express.Request<void, any>,
  //   res: express.Response<ApiResponses.GitHubUserResponse>,
  //   next,
  // ) => {

  // })
  .all(send405([ "GET" ]));

export default router;
