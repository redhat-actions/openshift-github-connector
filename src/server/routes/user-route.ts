import express from "express";

import ApiEndpoints from "common/api-endpoints";
import { send405, sendError } from "server/util/send-error";
import ApiResponses from "common/api-responses";
import User from "server/lib/user";

const router = express.Router();

router.route(ApiEndpoints.User.Root.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.GitHubUserResponse>,
    next,
  ) => {
    const installation = await User.getInstallationForSession(req, res);
    if (!installation) {
      return undefined;
    }

    const githubUserDataRes = await installation.octokit.request("GET /app/installations/{installation_id}", {
      // eslint-disable-next-line camelcase
      installation_id: installation.installationId,
    });

    const userData = githubUserDataRes.data.account;
    if (userData == null) {
      return sendError(res, 500, "GitHub responded with empty user info");
    }
    const resBody = userData as ApiResponses.GitHubUserResponse;

    return res.json(resBody);
  })
  .all(send405([ "GET" ]));

export default router;
