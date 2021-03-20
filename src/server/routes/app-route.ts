import express from "express";

import GitHubApp from "../lib/gh-app/app";
import { send405 } from "../util/send-error";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import GitHubAppMemento from "../lib/gh-app/app-memento";
import Log from "../logger";

const router = express.Router();

router.route(ApiEndpoints.App.Root.path)
  .get(async (req, res, next) => {
    if (!GitHubApp.isInitialized()) {
      Log.info("App is not initialized");
      const resBody: ApiResponses.GitHubAppState = {
        app: false,
      };

      return res.json(resBody);
    }

    const app = GitHubApp.instance;
    const octo = app.installationOctokit;
    const installationsReq = octo.request("GET /app/installations");
    const repositoriesReq = octo.request("GET /installation/repositories");

    const installations = (await installationsReq).data;
    const repositories = (await repositoriesReq).data.repositories;

    const resBody: ApiResponses.GitHubAppState = {
      app: true,
      appConfig: app.configNoSecrets,
      appUrls: app.urls,
      installations,
      repositories,
    };

    return res.json(resBody);
  })
  .delete(async (req, res, next) => {
    await GitHubAppMemento.clear();
    res.status(204).send();
  })
  .all(send405([ "GET" ]));

export default router;
