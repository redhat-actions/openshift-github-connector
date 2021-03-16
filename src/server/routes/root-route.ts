import express from "express";

import GitHubApp from "../../lib/gh-app/app";
import { send405 } from "../util/send-error";
import Paths from "./paths";

const router = express.Router();

router.route(Paths.Root)
    .get((req, res, next) => {
        if (GitHubApp.isInitialized()) {
            return res.redirect(Paths.App.Root);
        }
        return res.render("index");
    })
    .all(send405([ "GET" ]));

router.route(Paths.Health)
    .get((req, res, next) => res.json({ status: "UP" }))
    .all(send405([ "GET" ]));

export = router;
