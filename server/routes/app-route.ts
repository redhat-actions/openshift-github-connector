import express from "express";

import GitHubApp from "../gh-app/app";
import GitHubAppConfig from "../gh-app/app-config";
import { send405, sendError } from "../util/error";
import Routes from "./routes";

const router = express.Router();
export default router;

router.route(Routes.App.Root)
    .get(async (req, res, next) => {
        if (!GitHubApp.isInitialized()) {
            return sendError(res, 400, `App has not yet been created.`);
        }

        const octo = GitHubApp.instance.installationOctokit;
        const installationsReq = octo.request("GET /app/installations");
        const repositoriesReq = octo.request("GET /installation/repositories");

        const installations = (await installationsReq).data;
        const repositories = (await repositoriesReq).data.repositories;

        return res.render("app", {
            appConfig: GitHubApp.instance.configNoSecrets,
            appUrls: GitHubApp.instance.urls,
            installations,
            repositories,
        });
    })
    .all(send405([ "GET" ]));

let githubAppConfig: GitHubAppConfig | undefined;

router.route(Routes.App.PostCreate)
    .get(async (req, res, next) => {
        // const { code, state } = req.query;
        const qsCode = req.query.code;
        req.query = {};

        if (qsCode == null) {
            throw new Error(`No code found in callback URL querystring`);
        }

        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const code = qsCode.toString();
        githubAppConfig = await GitHubAppConfig.createAppConfig(code);

        const newInstallURL = `https://github.com/settings/apps/${githubAppConfig.slug}/installations`;
        return res.redirect(newInstallURL);
    })
    .all(send405([ "GET" ]));

router.route(Routes.App.PostInstall)
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
        return res.redirect(Routes.App.Root);
    })
    .all(send405([ "GET" ]));
