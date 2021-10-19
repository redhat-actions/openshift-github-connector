import ApiEndpoints from "common/api-endpoints";
import express from "express";
import passport from "passport";
import passportOAuth2, { VerifyCallback } from "passport-oauth2";
import User from "server/lib/user/user";
import { UserSessionData } from "./lib/user/server-user-types";
import TokenUtil from "./lib/user/token-util";
import Log from "./logger";
import { fetchFromOpenShiftApiServer } from "./util/server-util";

export const OAUTH2_STRATEGY_NAME = "oauth2";
// export const MOCK_STRATEGY_NAME = "mock";

// these must match the container spec
// const OAUTH_SERVER_URL = "OAUTH_SERVER_URL";
const CLIENT_ID_ENVVAR = "OAUTH_CLIENT_ID";
const CLIENT_SECRET_ENVVAR = "OAUTH_CLIENT_SECRET";
const CALLBACK_URL_ENVVAR = "OAUTH_CALLBACK_URL";

interface OAuthServerInfo {
  issuer: string,
  authorization_endpoint: string,
  token_endpoint: string,
  // https://docs.openshift.com/container-platform/4.7/authentication/tokens-scoping.html
  scopes_supported: string[],
  response_types_supported: string[],           // "code" | "token"
  grant_types_supported: string[],              // "authorization_code" | "implicit"
  code_challenge_methods_supported: string[],   // "plain" | "S256"
}

// https://docs.openshift.com/container-platform/4.7/authentication/configuring-internal-oauth.html
const OAUTH_SERVER_PATH = ".well-known/oauth-authorization-server";

let cachedClusterOAuthServerInfo: OAuthServerInfo | undefined;

async function fetchClusterOAuthServerInfo(): Promise<OAuthServerInfo> {
  if (cachedClusterOAuthServerInfo) {
    Log.info(`Using cached cluster OAuth server info`);
    return cachedClusterOAuthServerInfo;
  }

  Log.info(`Fetching cluster OAuth server info from ${OAUTH_SERVER_PATH}`);

  return (await fetchFromOpenShiftApiServer(OAUTH_SERVER_PATH)) as OAuthServerInfo;
}

async function getOAuthStrategyOptions(): Promise<passportOAuth2.StrategyOptions> {
  // if (!isInCluster()) {
  //   throw new Error("Finding the cluster OAuth server outside of the cluster is not implemented");
  // }

  const clientID = process.env[CLIENT_ID_ENVVAR];
  if (!clientID) {
    throw new Error(`Client ID not set in env.${CLIENT_ID_ENVVAR}`);
  }
  Log.info(`Client ID is ${clientID}`);

  const clientSecret = process.env[CLIENT_SECRET_ENVVAR];
  if (!clientSecret) {
    throw new Error(`Client secret not set in env.${CLIENT_SECRET_ENVVAR}`);
  }

  const callbackURL = process.env[CALLBACK_URL_ENVVAR];
  if (!callbackURL) {
    throw new Error(`Callback URL not set in env.${CALLBACK_URL_ENVVAR}`);
  }
  Log.info(`Callback URL is ${callbackURL}`);

  const clusterOAuthServerInfo = await fetchClusterOAuthServerInfo();

  Log.info(`Authorization URL is ${clusterOAuthServerInfo.authorization_endpoint}`);

  // Log.info(`Cluster OAuth server info`, clusterOAuthServerInfo);

  // https://www.passportjs.org/packages/passport-oauth2/
  return {
    authorizationURL: clusterOAuthServerInfo.authorization_endpoint,
    tokenURL: clusterOAuthServerInfo.token_endpoint,
    clientID,
    clientSecret,
    callbackURL,
    state: true,
    pkce: true,
  };
}

export async function setupPassport(app: express.Application): Promise<void> {
  Log.info(`Attaching passport`);

  Log.info(`Using OpenShift OAuth as authentication strategy`);
  const oauthOptions = await getOAuthStrategyOptions();

  passport.use(OAUTH2_STRATEGY_NAME, new passportOAuth2.Strategy(
    { ...oauthOptions, passReqToCallback: true },
    async (
      req: express.Request,
      accessToken: string,
      _refreshToken: string,
      _profile: Record<string, unknown>,
      done: VerifyCallback
    ) => {

      Log.info(`OAuth callback received`);
      // Log.info(`Access token`, accessToken);

      // empty
      // Log.info(`Req body`, req.body);
      // openshift oauth does not provide a refresh token
      // Log.info(`REFRESH TOKEN`, refreshToken);
      // openshift oauth does not provide a profile
      // Log.info(`PROFILE`, profile);

      try {
        const sessionData = await buildUserSessionFromToken(accessToken);
        req.session.user = sessionData;

        await User.loadOrCreate(sessionData);
        // return done(undefined, sessionData);
        return done(undefined, sessionData);
      }
      catch (err) {
        Log.warn(`Authentication error: ${JSON.stringify(err)}`);
        return done(err);
      }
    }
  ));

  // we do not use the passport session middleware and rather manage the session ourselves.
  // so, we do not need to serialize/deserialize.
  /*
  passport.serializeUser((user: UserSessionData, done: (err: any, session: UserSessionData) => void) => {
    Log.info(`Serialize user ${user.info.uid}`);
    done(undefined, user);
  });

  passport.deserializeUser(async (userData: UserSessionData, done) => {
    Log.debug(`Deserialize user ${userData.info.uid}`);
    return done(undefined, userData);
  });
  */
  // app.use(passport.session());

  app.use(passport.initialize());

  // send unauthenticated requests a 401. The frontend will redirect to the login page.
  app.use(async (req, res, next) => {
    const shouldRedirect = await shouldAuthRedirect(req);

    if (shouldRedirect.reason) {
      Log.debug(
        `${!shouldRedirect.redirect ? "Not blocking" : "Blocking"} `
        + `${req.path} because ${shouldRedirect.reason}`
      );
    }

    if (shouldRedirect.redirect) {
      // return res.redirect(ApiEndpoints.Auth.Login.path);
      return res.send401();
    }
    return next();
  });

  Log.info(`Finished attaching passport`);
}

async function buildUserSessionFromToken(accessToken: string): Promise<UserSessionData> {
  Log.info(`Build user session from access token`);
  const now = Date.now();

  const userInfo = await TokenUtil.introspectUser(accessToken);
  const tokenInfo = await TokenUtil.introspectToken({ accessToken, createdAtEstimate: now });

  const sessionData: UserSessionData = {
    token: tokenInfo,
    info: userInfo,
  };

  return sessionData;
}

const ENDPOINTS_NO_AUTH: string[] = [
  ApiEndpoints.Auth.Login.path,
  // ApiEndpoints.Auth.LoginStatus.path,
  ApiEndpoints.Auth.OAuthCallback.path,
  ApiEndpoints.Webhook.path,
];
/*
.reduce((aggregator: string[], item) => {
  aggregator.push(item);
  aggregator.push(item + "/");

  return aggregator;
}, []);
*/

async function shouldAuthRedirect(req: express.Request): Promise<{ redirect: boolean, reason?: string }> {
  if (req.path.startsWith(ApiEndpoints.Root.path)) {
    if (ENDPOINTS_NO_AUTH.includes(req.path)
      || (req.path.endsWith("/") && ENDPOINTS_NO_AUTH.includes(req.path.substring(0, req.path.length - 1)))
    ) {
      return {
        redirect: false,
        reason: `request path is allowlisted`,
      };
    }

    if (req.session.user == null) {
      const bearer = "Bearer";
      const authHeader = req.headers.authorization;
      if (authHeader) {
        if (authHeader.startsWith(bearer)) {
          const token = authHeader.substring(bearer.length + 1);

          Log.info(`Authorization header is present; exchanging token for session data`);

          req.session.user = await buildUserSessionFromToken(token);

          Log.info(`Successfully built user session from token, user is ${req.session.user.info.name}`);

          // recursively call with the now-present session data.
          return shouldAuthRedirect(req);
        }

        Log.warn(`Authorization header is set but not recognized`);
      }

      return {
        redirect: true,
        reason: `there is no user session`,
      };
    }
    else if (req.session.user.token.expiresAtEstimate <= Date.now()) {
      return {
        redirect: true,
        reason: `user token appears to be expired`,
      };
    }
  }

  return {
    redirect: false,
  };
}
