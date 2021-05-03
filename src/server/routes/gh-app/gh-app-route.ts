import express from "express";

import ApiEndpoints from "common/api-endpoints";
import { send405, sendError } from "server/util/send-error";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import GitHubApp from "server/lib/github/gh-app";
import User from "server/lib/user";

const router = express.Router();

// cluster app state
router.route(ApiEndpoints.App.Existing.path)
  .get(async (req, res: express.Response<ApiResponses.AllAppsState>, next) => {

    const apps = await GitHubApp.loadAll();

    // no way to detect app public/private ?
    // const publicApps = apps?.filter((app) => {
    //  return app.config.vis
    // })

    if (apps == null || apps.length === 0) {
      return res.json({
        success: false,
        severity: "warning",
        message: "No app exists",
      });
    }

    Log.info(`There are ${apps.length} apps`);

    const resBody: ApiResponses.AllAppsState = {
      success: true,
      totalCount: apps.length,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      visibleApps: apps.filter((_app) => true).map((app) => {
        return {
          appId: app.id,
          appUrl: app.urls.app,
          avatarUrl: app.urls.avatar,
          created_at: app.config.created_at,
          name: app.config.name,
          newInstallationUrl: app.urls.newInstallation,
          owner: {
            avatar_url: app.config.owner.avatar_url,
            login: app.config.owner.login,
            html_url: app.config.owner.html_url,
          },
        };
      }),
    };

    return res.json(resBody);
  })
  .delete(async (req, res: express.Response<ApiResponses.RemovalResult>, next) => {
    const installation = await User.getInstallationForSession(req, res);
    if (!installation) {
      return undefined;
    }

    if (installation.user.ownsAppId !== installation.app.id) {
      return sendError(
        res, 403,
        `User ${installation.user.name} does not own ${installation.app.config.name}, and so cannot delete it.`
      );
    }

    await installation.app.delete(installation.user);

    return res.json({
      removed: true,
      message: `Removed ${installation.app.config.name}`,
      success: true,
    });
  })
  .all(send405([ "GET", "DELETE" ]));

export default router;
