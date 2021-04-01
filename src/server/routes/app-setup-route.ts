import express from "express";
import { v4 as uuid } from "uuid";

import { getClientUrl, getServerUrl } from "../util";
import ApiEndpoints from "../../common/api-endpoints";
import GitHubApp from "../lib/gh-app/app";
import { send405, sendError } from "../util/send-error";
import { CLIENT_CALLBACK_QUERYPARAM, exchangeCodeForAppConfig, getAppManifest } from "../lib/gh-app/app-config";
import ApiResponses from "../../common/api-responses";
import Log from "../logger";
import GitHubAppMemento from "../lib/gh-app/app-memento";
import HttpConstants from "../../common/http-constants";

const router = express.Router();

const STATE_TIME_LIMIT_MS = 5 * 60 * 1000;

// maps state tokens to info about the in-progress app creation
const creationsInProgress = new Map<string, { iat: number, sessionID: string }>();

const CREATION_COOKIE_NAME = "creation_data";
// Prefer to keep this short,
// but we have to leave enough time for user to select all the repositories they want
// and give them a way to recover from failing to do it in time without recreating the app
const CREATION_COOKIE_EXPIRY = 15 * 60 * 1000;
type CreationCookieData = Omit<GitHubAppMemento, "installationId"> & { sessionID: string };

router.route(ApiEndpoints.Setup.CreateApp.path)
  .get(async (req, res, next) => {
    const state = uuid();
    creationsInProgress.set(state, { iat: Date.now(), sessionID: req.sessionID });
    const manifest = getAppManifest(getServerUrl(req, false), getClientUrl(req));

    const resBody: ApiResponses.CreateAppResponse = {
      manifest, state,
    };

    Log.info(`Heres the manifest`, manifest);

    return res
      // this page is not cached or you run into issues with state reuse if you use back/fwd buttons
      .header(HttpConstants.Headers.CacheControl, "no-store")
      .json(resBody);
  })
  .all(send405([ "GET" ]));

// NOTE THAT since post-create-app and post-install-app have their requests originate from github.com,
// these requests have a DIFFERENT session ID cookie
// so you CANNOT try and use it here to persist data.

router.route(ApiEndpoints.Setup.PostCreateApp.path)
  .get(async (req, res, next) => {
    // const { code, state } = req.query;
    const state = req.query.state?.toString();
    if (!state) {
      return sendError(
        res, 400,
        `No state provided in querystring. Please restart the app creation process`,
        `Missing state`
      );
    }

    const stateMapValue = creationsInProgress.get(state);
    if (!stateMapValue) {
      return sendError(
        res, 400,
        `The state parameter provided was not issued by this application, `
          + `or has already been claimed. Please restart the app creation process.`,
        `Invalid state`
      );
    }
    creationsInProgress.delete(state);
    const stateAge = Date.now() - stateMapValue.iat;
    if (stateAge > STATE_TIME_LIMIT_MS) {
      return sendError(
        res, 400,
        `The state parameter provided has expired. Please restart the app creation process.`,
        `Expired state`
      );
    }

    res.removeHeader(HttpConstants.Headers.CacheControl);

    const code = req.query.code?.toString();
    if (!code) {
      throw new Error(`No code found in callback URL query`);
    }

    // req.query = {};

    const config = await exchangeCodeForAppConfig(code);

    const creationData: CreationCookieData = {
      appId: config.id.toString(),
      privateKey: config.pem,
      sessionID: stateMapValue.sessionID,
    };

    res.cookie(CREATION_COOKIE_NAME, JSON.stringify(creationData), {
      httpOnly: true,
      maxAge: CREATION_COOKIE_EXPIRY,
      secure: req.secure,
      // Because the endpoint that uses this cookie has its request inititated by GitHub,
      // we cannot use the strict SS policy.
      sameSite: "lax",
    });

    const newInstallURL = `https://github.com/settings/apps/${config.slug}/installations`;
    return res.redirect(newInstallURL);
  })
  .all(send405([ "GET" ]));

router.route(ApiEndpoints.Setup.PostInstallApp.path)
  .get(async (req, res, next) => {
    // 'install' or 'update'
    // const setupAction = req.query.setup_action;

    const installationId = req.query.installation_id?.toString();
    if (installationId == null) {
      return sendError(
        res, 400,
        `No installation_id provided in querystring`,
        `Missing installation_id`
      );
    }

    if (Number.isNaN(installationId)) {
      return sendError(
        res, 400, `installation_id "${installationId}" is not a number`,
        `Invalid installation_id`
      );
    }

    const creationCookieRaw = req.cookies[CREATION_COOKIE_NAME];
    if (creationCookieRaw == null) {
      return sendError(
        res, 400, `App creation flow cookie '${CREATION_COOKIE_NAME}' is missing. `
          + `Please restart the app creation process.`,
        `Missing ${CREATION_COOKIE_NAME} cookie`,
      );
    }
    res.clearCookie(CREATION_COOKIE_NAME);

    const creationCookieData = JSON.parse(creationCookieRaw) as CreationCookieData;

    if (!creationCookieData.appId || !creationCookieData.privateKey || !creationCookieData.sessionID) {
      return sendError(
        res, 400,
        `Creation cookie is missing required field. Please restart the app creation process.`,
        `${CREATION_COOKIE_NAME} missing key`,
      );
    }

    Log.info(`Cookie SID is ${req.sessionID}`);
    Log.info(`Saved-state SID is ${creationCookieData.sessionID}`);

    const memento: GitHubAppMemento = {
      appId: creationCookieData.appId,
      privateKey: creationCookieData.privateKey,
      installationId,
    };

    const app = await GitHubApp.create(creationCookieData.sessionID, memento, true);

    Log.info(`Successfully created new GitHub app ${app.config.name}`);

    const clientCallbackUrlRaw = req.query[CLIENT_CALLBACK_QUERYPARAM];
    if (!clientCallbackUrlRaw) {
      return sendError(
        res, 400,
        `Callback URL is missing from query. Please restart the app creation process.`,
        `Missing query parameter`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const clientCallbackUrl = clientCallbackUrlRaw.toString();

    Log.debug(`Post-install redirect to ${clientCallbackUrl}`);

    return res.redirect(clientCallbackUrl);
  })
  .all(send405([ "GET" ]));

export default router;
