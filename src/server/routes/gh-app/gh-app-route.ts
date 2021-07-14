import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import { send405 } from "server/express-extends";
import GitHubAppSerializer from "server/lib/github/gh-app-serializer";

const router = express.Router();

router.route(ApiEndpoints.App.Root.path)
  .get(async (req, res: express.Response<ApiResponses.ClusterAppState>, next) => {

    const apps = await GitHubAppSerializer.loadAll();

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

    const resBody: ApiResponses.ClusterAppState = {
      success: true,
      totalCount: apps.length,
      visibleApps: apps.map((app) => {
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
      }).sort((a, b) => {
        // sort newest -> oldest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    };

    return res.json(resBody);
  });

const PARAM_APPID = "appId";

router.route(ApiEndpoints.App.Root.path + "/:" + PARAM_APPID)
  .delete(async (req, res: express.Response<ApiResponses.RemovalResult>, next) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    if (!req.params[PARAM_APPID]) {
      return res.sendError(400, `App ID not provided in request path`);
    }

    const appId = Number(req.params[PARAM_APPID]);

    if (Number.isNaN(appId)) {
      return res.sendError(400, `Invalid app ID "${appId}" provided in request path`);
    }

    const app = await GitHubAppSerializer.load(appId);
    if (!app) {
      return res.sendError(404, `App ${appId} not found`);
    }

    if (!user.ownsAppIds.includes(app.id)) {
      return res.sendError(
        403,
        `User ${user.name} does not own app ${appId}, and so cannot delete it.`
      );
    }

    await GitHubAppSerializer.remove(app, user);

    return res.json({
      removed: true,
      message: `Removed ${app.config.name}`,
      success: true,
    });
  })
  .all(send405([ "DELETE" ]));

export default router;
