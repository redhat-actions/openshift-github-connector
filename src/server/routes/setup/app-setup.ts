import express from "express";
import { v4 as uuid } from "uuid";

import { getServerUrl } from "../../util";
import Paths from "../../../common/paths";
import { GitHubAppConfig } from "../../../common/interfaces/github-app";
import GitHubApp from "../../lib/gh-app/app";
import { send405, sendError } from "../../util/send-error";
import { createAppConfig, getAppManifest } from "../../lib/gh-app/app-config";

const router = express.Router();

let githubAppConfig: GitHubAppConfig | undefined;

router.route(Paths.Setup.CreateApp)
    .get(async (req, res, next) => {
        const state = uuid();
        const manifest = getAppManifest(getServerUrl(req, false));

        return res.json({
            manifest,
            state,
        });
    })
    .all(send405([ "GET" ]));

router.route(Paths.Setup.PostCreate)
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

router.route(Paths.Setup.PostInstall)
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
        return res.redirect(Paths.App.Root);
    })
    .all(send405([ "GET" ]));

export default router;
