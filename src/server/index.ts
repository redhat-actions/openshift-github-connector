import "source-map-support/register";
import express from "express";
import "express-async-errors";
import http from "http";
import https from "https";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import Routes from "./routes";
import { send405, sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "./logger";
import { startup } from "./startup";
import { getFriendlyHTTPError } from "./util/server-util";
import getSessionMw from "./session-mw";
import getCertData from "./util/get-cert";

function loadEnv(envPath: string): void {
  const result = dotenv.config({ path: envPath });
  if (result.parsed) {
    Log.info(`Loaded ${envPath}`, result.parsed);
  }
  else if (result.error) {
    Log.error(`Failed to load ${envPath}`, result.error);
  }
}

const app = express();

Log.info(`NODE_ENV="${process.env.NODE_ENV}"`);
const isProduction = process.env.NODE_ENV === "production";

// The containerfile build must use these same paths
const FRONTEND_ROOT_DIR = isProduction ? "client" : path.join("..", "..", "build");
// const FRONTEND_ROOT_DIR = "client";
const frontendPath = path.join(__dirname, FRONTEND_ROOT_DIR);
Log.info(`Frontend path is ${frontendPath}`);
const indexHtmlPath = path.join(frontendPath, "index.html");

const PLUGIN_ROOT_DIR = "plugin";
const pluginPath = path.join(__dirname, PLUGIN_ROOT_DIR);
Log.info(`Plugin path is ${pluginPath}`);

if (isProduction) {
  Log.info(`Running in PRODUCTION mode`);

  [ frontendPath, pluginPath ].forEach((staticPath) => {
    // const staticPath = path.join(__dirname, staticRelPath);
    Log.info(`Statically serving "${staticPath}"`);
    app.use(express.static(staticPath));
  });
}
else {
  Log.info(`Running in DEVELOPMENT mode`);
  // in this case, the client and plugin are served by their respective webpack dev servers.
  loadEnv(".env");
  loadEnv(".env.local");
}

// Middleware runs in the order in which they are added here //

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(getLoggingMiddleware());

/*
Log.info(`In k8s=${isInK8s()}`);

if (isInK8s()) {
  Log.info(`Trusting first proxy`);
  app.set("trust proxy", 1);
}
*/

/*
const allowedOrigins = getAllowedOrigins();
Log.info(`Allow origins: ${allowedOrigins.join(" ")}`);
app.use(cors({
  origin: allowedOrigins,
}));
*/
app.use(getSessionMw());

// Routes here - Put middleware above //

Object.values(Routes).map((router) => app.use(router));

Log.info(`API root is ${ApiEndpoints.Root.path}`);

app.route("/")
  .get((req, res, next) => {
    res.send(`Hello! This is the app root. The API is at ${ApiEndpoints.Root.path}`);
  })
  .all(send405([ "GET" ]));

app.route(ApiEndpoints.Root.path)
  .get((req, res, next) => {
    res.send(`Hello! This is the API root.`);
  })
  .all(send405([ "GET" ]));

function sendHealth(res: express.Response<ApiResponses.Result>): void {
  res.json({ success: true, message: "OK" });
}

app.route("/health")
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

app.route(ApiEndpoints.Health.path)
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

// End routes - Error handlers here //

// catch 404
app.use(async (req, res, next) => {

  if (req.path.startsWith(ApiEndpoints.Root.path)) {
    return sendError(res, 404, `No route at ${req.url}`);
  }
  else if (req.method === "GET") {
    return res.sendFile(indexHtmlPath);
  }
  return sendError(res, 404, `Cannot ${req.method} ${req.url}`);
});

// error handler
app.use((err_: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  let err = err_;

  if (err_.response) {
    err = getFriendlyHTTPError(err_);
  }

  Log.error(`Uncaught error:`, err);

  let message = err.message || err.toString();
  if (message === "[object Object]") {
    message = JSON.stringify(err);
  }

  sendError(res, 500, message, "danger", false);
});

// Start server once all middleware are in place //

const httpPort = process.env.BACKEND_HTTP_PORT || 3003;

Log.info(`HTTP Port is ${httpPort}`);

http.createServer(app).listen(httpPort)
  .on("listening", () => {
    Log.info(`HTTP listening on port ${httpPort}`);
  }).on("error", (err) => {
    Log.fatal(`Failed to start HTTP server`, err);
  });

if (isProduction) {
  Log.info(`In production, starting HTTPS server`);

  const httpsPort = process.env.BACKEND_HTTPS_PORT || 3443;
  Log.info(`HTTPS Port is ${httpsPort}`);

  getCertData()
    .then((tlsOptions) => {
      https.createServer(tlsOptions, app).listen(httpsPort)
        .on("listening", () => {
          Log.info(`HTTPS listening on port ${httpsPort}`);
        }).on("error", (err) => {
          Log.fatal(`Failed to start HTTPS server`, err);
        });
    })
    .catch((err) => {
      Log.fatal(`Failed to read TLS cert data`, err);
    });
}
else {
  Log.info(`Not listening for HTTPS traffic`);
}

startup()
  .then(() => {
    Log.info(`Finished startup`);
  })
  .catch((err) => {
    Log.error(`Uncaught startup error`, err);
  });
