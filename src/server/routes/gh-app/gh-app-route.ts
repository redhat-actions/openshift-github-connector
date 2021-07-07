import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import GitHubApp from "server/lib/github/gh-app";
import { send405 } from "server/express-extends";

const router = express.Router();

// cluster app state
router.route(ApiEndpoints.App.Root.path)
  .get(async (req, res: express.Response<ApiResponses.ClusterAppState>, next) => {

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
  })
  .delete(async (req, res: express.Response<ApiResponses.RemovalResult>, next) => {
    const user = await req.getUserOrDie();
    if (!user) {
      return undefined;
    }

    const installation = user.installation;
    if (!installation) {
      return res.sendError(400, `No app installation for user ${user.name}`);
    }

    if (installation.user.ownsAppId !== installation.app.id) {
      return res.sendError(
        403,
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
