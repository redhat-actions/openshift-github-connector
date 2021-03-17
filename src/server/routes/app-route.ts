import express from "express";

import GitHubApp from "../lib/gh-app/app";
import { send405, sendError } from "../util/send-error";
import Paths from "../../common/paths";
import { AppPageState } from "../../common/interfaces/api-types";

const router = express.Router();

router.route(Paths.App.Root)
    .get(async (req, res, next) => {
        if (!GitHubApp.isInitialized()) {
            return sendError(res, 400, `App has not yet been created.`);
        }

        const app = GitHubApp.instance;
        const octo = app.installationOctokit;
        const installationsReq = octo.request("GET /app/installations");
        const repositoriesReq = octo.request("GET /installation/repositories");

        const installations = (await installationsReq).data;
        const repositories = (await repositoriesReq).data.repositories;

        const resBody: AppPageState = {
            appConfig: app.configNoSecrets,
            appUrls: app.urls,
            installations,
            repositories,
        };

        return res.json(resBody);
    })
    .all(send405([ "GET" ]));

export default router;
