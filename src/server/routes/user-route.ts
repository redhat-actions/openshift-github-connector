import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import { send405 } from "server/express-extends";

const router = express.Router();

router.route(ApiEndpoints.User.Root.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.UserResponse>,
    next
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      /*
      return res.json({
        message: `Not logged in`,
        success: false,
      });*/
      return undefined;
    }

    return res.json({
      success: true,
      message: `User is ${user.name}`,
      severity: "info",
      ...user.allInfo,
      // ...user.githubUserInfo,
    });
  }).all(send405([ "GET" ]));

/*
router.route(ApiEndpoints.User.UserGitHub.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.OpenShiftUserResponse>,
    next
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    if (!user.githubUserInfo) {
      return res.json({
        success: false,
        message: `No GitHub user info for ${user.name}`,
        severity: "warning",
      });
    }

    return res.json({
      success: true,
      message: `User is ${user.name} and GitHub username is ${user.githubUserInfo.name}`,
      severity: "info",
      ...user.allInfo,
    });
  }).all(send405([ "GET" ]));
  */

/*
router.route(ApiEndpoints.User.UserGitHubDetails.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.GitHubUserDetailsResponse>,
    next,
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const installation = user.installation;
    if (!installation) {
      return res.sendError(400, `No app installation for user ${user.name}`);
    }

    const githubUserDataRes = await installation.octokit.request("GET /app/installations/{installation_id}", {
      installation_id: installation.installationId,
    });

    const userData = githubUserDataRes.data.account;
    if (userData == null) {
      return res.sendError(500, "GitHub responded with empty user info");
    }
    const resBody = userData as ApiResponses.GitHubUserDetailsResponse;

    return res.json(resBody);
  })
  .all(send405([ "GET" ]));

*/

export default router;
