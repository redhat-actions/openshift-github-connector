import express from "express";
import { v4 as uuid } from "uuid";

import { getClientUrl as getFrontendUrl, getServerUrl, removeTrailingSlash } from "../util";
import ApiEndpoints from "../../common/api-endpoints";
import { GitHubAppConfig } from "../../common/types/github-app";
import GitHubApp from "../lib/gh-app/app";
import { send405, sendError } from "../util/send-error";
import { createAppConfig, getAppManifest } from "../lib/gh-app/app-config";
import ApiResponses from "../../common/api-responses";
import Log from "../logger";

const router = express.Router();

let githubAppConfig: GitHubAppConfig | undefined;
// hack
let clientUrl: string | undefined;

router.route(ApiEndpoints.Setup.CreateApp.path)
  .get(async (req, res, next) => {
    const state = uuid();
    const manifest = getAppManifest(getServerUrl(req, false));

    const resBody: ApiResponses.CreateAppResponse = {
      manifest, state,
    };
    clientUrl = removeTrailingSlash(getFrontendUrl(req));

    return res.json(resBody);
  })
  .all(send405([ "GET" ]));

router.route(ApiEndpoints.Setup.PostCreateApp.path)
  .get(async (req, res, next) => {
    // const { code, state } = req.query;
    const qsCode = req.query.code;
    req.query = {};

    if (qsCode == null) {
      throw new Error(`No code found in callback URL querystring`);
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const code = qsCode.toString();
    githubAppConfig = await createAppConfig(code);

    const newInstallURL = `https://github.com/settings/apps/${githubAppConfig.slug}/installations`;
    return res.redirect(newInstallURL);
  })
  .all(send405([ "GET" ]));

router.route(ApiEndpoints.Setup.PostInstallApp.path)
  .get(async (req, res, next) => {
    // 'install' or 'update'
    // const setupAction = req.query.setup_action;

    if (githubAppConfig == null) {
      throw new Error(`GitHub App Config was not created before post install callback`);
    }

    const installationIDStr = req.query.installation_id?.toString();
    if (installationIDStr == null) {
      return sendError(res, 400, `No installation ID provided to setup callback!`);
    }
    if (Number.isNaN(installationIDStr)) {
      throw new Error(`Installation ID "${installationIDStr}" is invalid`);
    }
    const installationID = Number(installationIDStr);

    await GitHubApp.create(githubAppConfig, installationID);
    if (!clientUrl) {
      throw new Error("clientUrl is undefined, nowhere to redirect to");
    }

    const redirectUrl = clientUrl + ApiEndpoints.App.Root.path;
    Log.debug(`Post-install redirect to ${redirectUrl}`);
    return res.redirect(redirectUrl);
  })
  .all(send405([ "GET" ]));

export default router;
