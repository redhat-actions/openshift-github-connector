import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import GitHubApp from "server/lib/github/gh-app";
import { send405 } from "server/express-extends";

const router = express.Router();

router.route(ApiEndpoints.User.App.path)
  .get(async (req, res: express.Response<ApiResponses.UserAppState>, next) => {
    const user = await req.getUserOrDie();
    if (!user) {
      return undefined;
    }

    // there are four states which correspond to the subtypes of ApiResponses.GitHubAppState,
    // depending on two variables -
    // 1. does the user own an app?
    // 2. does the user have an app installed?

    let installedAppResponse: ApiResponses.UserAppInstalled | undefined;
    let installedAppData: ApiResponses.UserAppInstalledData | undefined;

    if (user.installation != null) {
      installedAppData = {
        installation: user.installation.installationData,
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

    /*
    if (user.ownsAppIds.length > 0) {
      // owned
      const ownedApps = await Promise.all(user.ownsAppIds.map((appId) => GitHubApp.load(appId))) as Array<GitHubApp>;
      if (ownedApps.length < user.ownsAppIds.length) {
        throw new Error(`User "${user.name} owns apps ${user.ownsAppIds.join(", ")} `
          + `but at least one app was not found. Apps found were ${ownedApps.join(", ")}`);
      }

      const appData = ownedApps.map((app) => ({
        html_url: app.config.html_url,
        name: app.config.name,
        slug: app.config.slug,
      }));
    */

    if (user.ownsAppId != null) {
      // owned
      const ownedApp = await GitHubApp.load(user.ownsAppId);
      if (!ownedApp) {
        throw new Error(`User "${user.name} owns app ${user.ownsAppId} but that app was not found`);
      }

      const appData = {
        html_url: ownedApp.config.html_url,
        name: ownedApp.config.name,
        slug: ownedApp.config.slug,
      };

      const ownedAppData: ApiResponses.UserOwnedAppData = {
        appConfig: ownedApp.getWithoutSecrets,
        installations: await ownedApp.getInstallations(),
        ownerUrls: ownedApp.urls,
      };

      if (installedAppData != null) {
        // owned and installed

        const combinedData: ApiResponses.UserAppOwnedAndInstalled = {
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

      const ownedAppResponse: ApiResponses.UserAppOwned = {
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

    if (!installedAppResponse) {
      // neither owned nor installed

      const resBody: ApiResponses.GitHubAppMissing = {
        message: `User "${user.name}" does not own an app, or have an app installed.`,
        success: false,
      };

      return res.json(resBody);
    }

    // not owned, but installed
    return res.json(installedAppResponse);
  })
  .delete(async (
    req, res: express.Response<ApiResponses.RemovalResult>, next
  ) => {
    const user = await req.getUserOrDie();
    if (!user) {
      return res.sendError(401, `Authentication required`);
    }

    const removed = await user.removeInstallation();
    const message = removed
      ? `Removed app installation from ${user.name}"`
      : `No installation was found for ${user.name}`;

    return res.json({
      success: true,
      message,
      removed,
    });
  })
  .all(send405([ "GET", "DELETE" ]));

export default router;
