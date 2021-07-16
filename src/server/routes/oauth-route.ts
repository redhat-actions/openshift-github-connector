import express from "express";
import passport from "passport";

import Log from "server/logger";
import ApiEndpoints from "common/api-endpoints";
import { OAUTH2_STRATEGY_NAME } from "server/oauth";
import ApiResponses from "common/api-responses";
import { send405 } from "server/express-extends";

const oauthRouter = express.Router();

/*
function sendAuthenticationDisabled(req: express.Request, res: express.Response<ApiResponses.Result>): void {
  res.json({ success: true, message: "Authentication disabled" });
}
*/

// const strategy = isInCluster() ? OAUTH2_STRATEGY_NAME : MOCK_STRATEGY_NAME;
const strategy = OAUTH2_STRATEGY_NAME;
Log.info(`Passport strategy is ${strategy}`);

// https://docs.openshift.com/container-platform/4.7/authentication/tokens-scoping.html
const OAUTH_SCOPE = "user:full";

const SUCCESS_REDIRECT = "/";

const session = false;

oauthRouter.route(ApiEndpoints.Auth.Login.path)
  .get(passport.authenticate(strategy, {
    scope: OAUTH_SCOPE,
    prompt: `Log in to OpenShift GitHub Connector`,
    session,
  }))
  .delete(async (req, res: express.Response<ApiResponses.Result>, next) => {
    if (req.session.user) {
      req.session.user = undefined;

      return res.json({
        message: `Logged out`,
        success: true,
      });
    }

    return res.json({
      message: `No session to log out`,
      success: false,
    });
  })
  .all(send405([ "GET" ]));

oauthRouter.route(ApiEndpoints.Auth.OAuthCallback.path)
  .get(passport.authenticate(strategy, {
    successRedirect: SUCCESS_REDIRECT,
    failureMessage: true,
    failWithError: true,
    session,
  }))
  .all(send405([ "GET" ]));

/*
oauthRouter.route(ApiEndpoints.Auth.LoginStatus.path)
  .get(async (req, res: express.Response<ApiResponses.Result>, next) => {

    Log.info(`Login status check`);

    const user = await req.getUserOrDie(false);
    if (!user) {
      Log.info(`Not logged in`);

      return res.json({
        message: `Not logged in`,
        success: false,
      });
    }

    Log.info(`Logged in`);

    return res.json({
      message: `Logged in as ${user.name}`,
      success: true,
    });
  })
  .all(send405([ "GET", "DELETE" ]));
*/

Log.info(`Login endpoint is ${ApiEndpoints.Auth.Login}`);
Log.info(`Callback is ${ApiEndpoints.Auth.OAuthCallback}`);

export default oauthRouter;
