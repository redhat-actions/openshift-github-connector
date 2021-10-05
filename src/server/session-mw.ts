import express from "express";
import session from "express-session";
import sessionFileStore from "session-file-store";
import { v4 as uuid } from "uuid";
import { tmpdir } from "os";

import Log from "server/logger";
import ApiEndpoints from "common/api-endpoints";
import { isProduction } from "./util/server-util";

const dayMs = 1000 * 60 * 60 * 24;
const FileStore = sessionFileStore(session);

const SECRET_NAME = "SESSION_SECRET";
const STORE_SECRET_NAME = "SESSION_STORE_SECRET";
const STORE_PATH = "SESSION_STORE_PATH";

function getSessionMw(): express.RequestHandler {
  // the secrets are created by the helm chart
  let secret = process.env[SECRET_NAME];
  if (!secret) {
    Log.error(`Session secret "${SECRET_NAME}" is not set in the environment!`);
    // sessions will expire on server restart :(
    secret = uuid();
  }
  else {
    Log.info(`Loaded session secret`);
  }

  let storeSecret = process.env[STORE_SECRET_NAME];
  if (!storeSecret) {
    Log.error(`Session store secret "${STORE_SECRET_NAME}" is not set in the environment!`);
    storeSecret = uuid();
  }
  else {
    Log.info(`Loaded session store secret`);
  }

  let storePath = process.env[STORE_PATH];
  if (!storePath) {
    Log.error(`Session store path "${STORE_PATH}" is not set in the environment!`);
    storePath = tmpdir();
  }
  Log.info(`Session store path is "${storePath}"`);

  // https://github.com/expressjs/session#options
  const sessionMw = session({
    secret,
    store: new FileStore({
      logFn: (args) => Log.debug(args),
      path: storePath,
      secret: storeSecret,
      ttl: dayMs,
    }),
    resave: false,
    saveUninitialized: true,
    rolling: true,
    unset: "destroy",
    genid: (req): string => {
      const id = uuid();
      return id;
    },
    cookie: {
      // do not send the cookie on requests for static content (no need)
      path: ApiEndpoints.Root.path,
      httpOnly: true,
      maxAge: dayMs,
      // samesite can cause problems in dev with the oauth lib,
      // but has to be enabled in production to protect against csrf
      // https://github.com/auth0/passport-auth0/issues/70#issuecomment-432895163
      sameSite: isProduction(),
      secure: "auto",
      signed: true,
    },
  });

  Log.info(`Created session middleware`);
  return sessionMw;
}

export default getSessionMw;
