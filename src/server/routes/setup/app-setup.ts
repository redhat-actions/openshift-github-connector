import express from "express";
import { v4 as uuid } from "uuid";

import { getServerUrl } from "../../util";
import Endpoints from "../../../common/endpoints";
import { GitHubAppConfig } from "../../../common/interfaces/github-app";
import GitHubApp from "../../lib/gh-app/app";
import { send405, sendError } from "../../util/send-error";
import { createAppConfig, getAppManifest } from "../../lib/gh-app/app-config";

const router = express.Router();

let githubAppConfig: GitHubAppConfig | undefined;

router.route(Endpoints.Setup.CreateApp.path)
    .get(async (req, res, next) => {
        const state = uuid();
        const manifest = getAppManifest(getServerUrl(req, false));

        return res.json({
            manifest,
            state,
        });
    })
    .all(send405([ "GET" ]));

router.route(Endpoints.Setup.PostCreateApp.path)
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

router.route(Endpoints.Setup.PostInstallApp.path)
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
        return res.redirect(Endpoints.App.path);
    })
    .all(send405([ "GET" ]));

export default router;
