import express from "express";
import { v4 as uuid } from "uuid";

import GitHubApp from "../gh-app/app";
import GitHubAppConfig from "../gh-app/app-config";
import { send405 } from "../util/error";
import { getServerUrl as getReqUrl } from "../util/util";
import Routes from "./routes";

const router = express.Router();

router.route(Routes.Root)
    .get((req, res, next) => {
        if (GitHubApp.isInitialized()) {
            return res.redirect(Routes.App.Root);
        }

        const state = uuid();
        const appManifest = GitHubAppConfig.getAppManifest(getReqUrl(req, false));
        const appManifestStr = JSON.stringify(appManifest);
        return res.render("index", { appManifest: appManifestStr, state });
    })
    .all(send405([ "GET" ]));

router.route(Routes.Health)
    .get((req, res, next) => res.json({ status: "UP" }))
    .all(send405([ "GET" ]));

export = router;
