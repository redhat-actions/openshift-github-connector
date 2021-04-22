import express from "express";
import { Octokit } from "@octokit/core";

import ApiEndpoints from "common/api-endpoints";
import { send405, sendError } from "server/util/send-error";
import GitHubUserMemento from "server/lib/memento/user-memento";
import ApiResponses from "common/api-responses";

const router = express.Router();

router.route(ApiEndpoints.User.Root.path)
  .get(async (
    req: express.Request<any, void>,
    res: express.Response<ApiResponses.GitHubUserResponse>,
    next,
  ) => {
    const userId = req.session.data?.githubUserId;
    if (!userId) {
      return sendError(res, 400, `No user ID in session cookie`);
    }

    const user = await GitHubUserMemento.loadUser(userId);
    if (!user) {
      return sendError(res, 500, `Failed to look up user ${userId}`);
    }

    // since we only want public data here we use an unauthenticated octokit
    const githubUserDataRes = await (new Octokit()).request("GET /users/{username}", { username: user.userName });

    const resBody: ApiResponses.GitHubUserResponse = githubUserDataRes.data;

    return res.json(resBody);
  })
  .all(send405([ "GET" ]));

export default router;
