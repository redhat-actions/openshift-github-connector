import express from "express";

import Views from "../../views/util/views";
import GitHubApp from "../../lib/gh-app/app";
import { send405, sendError } from "../util/send-error";
import { AppPageProps } from "../../views/app-page";
import Paths from "./paths";

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

        const props: AppPageProps = {
            appConfig: app.configNoSecrets,
            appUrls: app.urls,
            installations,
            repositories,
        };

        return res.render(Views.App, props);
    })
    .all(send405([ "GET" ]));

export default router;
