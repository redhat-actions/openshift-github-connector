import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import { send405 } from "server/util/send-error";
import User from "server/lib/user";
import GitHubApp from "server/lib/github/gh-app";
import { deleteSecrets } from "common/types/github-types";

const router = express.Router();

router.route(ApiEndpoints.App.Root.path)
  .get(async (req, res: express.Response<ApiResponses.GitHubAppState>, next) => {
    const user = await User.getUserForSession(req, res);
    if (!user) {
      return undefined;
    }

    // there are four states which correspond to the subtypes of ApiResponses.GitHubAppState,
    // depending on two variables -
    // 1. does the user own an app?
    // 2. does the user have an app installed?

    let installedAppResponse: ApiResponses.GitHubAppInstalled | undefined;
    let installedAppData: ApiResponses.GitHubAppInstalledData | undefined;

    if (user.installation != null) {
      installedAppData = {
        installation: await user.installation.getInstallation(),
        installUrls: user.installation.urls,
        repos: await user.installation.getRepos(),
      };

      installedAppResponse = {
        installed: true,
        owned: false,
        success: true,

        appData: {
          html_url: user.installation.app.config.html_url,
          name: user.installation.app.config.name,
          slug: user.installation.app.config.slug,
        },
        installedAppData,
      };
    }

    if (user.ownsAppId != null) {
      // owned
      const ownedApp = await GitHubApp.load(user.ownsAppId);
      if (!ownedApp) {
        throw new Error(`User "${user.userName} owns app ${user.ownsAppId} but that app was not found`);
      }

      const appData = {
        html_url: ownedApp.config.html_url,
        name: ownedApp.config.name,
        slug: ownedApp.config.slug,
      };

      const ownedAppData: ApiResponses.GitHubAppOwnedData = {
        appConfig: deleteSecrets(ownedApp.config),
        installations: await ownedApp.getInstallations(),
        ownerUrls: ownedApp.urls,
      };

      if (installedAppData != null) {
        // owned and installed

        const combinedData: ApiResponses.GitHubAppOwnedAndInstalled = {
          success: true,

          // this is duplicated in this obj
          appData,
          installedAppData,
          installed: true,
          ownedAppData,
          owned: true,
        };

        return res.json(combinedData);
      }

      const ownedAppResponse: ApiResponses.GitHubAppOwned = {
        success: true,
        installed: false,
        owned: true,

        appData,
        ownedAppData,
      };

      // owned but not installed
      return res.json(ownedAppResponse);
    }

    // not owned

    // const appInstallation = await User.getUserAppForSession(req, res);
    // if (!appInstallation) {
    //   // neither owned nor installed
    //   const rb: ApiResponses.GitHubAppMissing = {
    //     message: `User "${user.userName} does not own an app, or have an app installed.`,
    //     success: false,
    //   };

    //   return res.json(rb);
    // }

    if (!installedAppResponse) {
      // neither owned nor installed

      const resBody: ApiResponses.GitHubAppMissing = {
        message: `User "${user.userName} does not own an app, or have an app installed.`,
        success: false,
      };

      return res.json(resBody);
    }

    // not owned, but installed
    return res.json(installedAppResponse);
  })
  .all(send405([ "GET" ]));

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
