import express from "express";

import { send405, sendError } from "../util/send-error";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import GitHubAppMemento from "../lib/memento/app-memento";
import { getAppForSession } from "../lib/gh-app/gh-util";
import { sendSuccessStatusJSON } from "../util/server-util";

const router = express.Router();

router.route(ApiEndpoints.App.Root.path)
  .get(async (req, res, next) => {
    const app = await getAppForSession(req, res);
    if (!app) {
      return;
    }

    const octo = app.install.octokit;
    const installationsReq = octo.request("GET /app/installations");

    const installations = (await installationsReq).data;
    const repositories = await app.getAccessibleRepos();

    const resBody: ApiResponses.GitHubAppState = {
      app: true,
      appConfig: app.config,
      appUrls: app.urls,
      installations,
      repos: repositories,
    };

    res.json(resBody);
  })
  .delete(async (req, res, next) => {
    if (!req.session.data) {
      return sendError(res, 400, `Failed to delete app: Invalid app or user data`);
    }

    await GitHubAppMemento.deleteApp(req.session.data.githubUserId);
    return sendSuccessStatusJSON(res, 204);
  })
  .all(send405([ "GET", "DELETE" ]));

/*
router.route(ApiEndpoints.App.Repos.path)
  .get(async (req, res, next) => {
    const app = await getAppForSession(req, res);
    if (!app) {
      return;
    }

    const octo = app.install.octokit;
    const repositoriesReq = octo.request("GET /installation/repositories");

    const repos = (await repositoriesReq).data.repositories;

    const resBody: ApiResponses.GitHubAppRepos = { app: true, repos };

    res.json(resBody);
  })
  .all(send405([ "GET", "DELETE" ]));
  */

export default router;
