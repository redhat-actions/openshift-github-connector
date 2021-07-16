import "source-map-support/register";
import express from "express";
import "express-async-errors";
import https from "https";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import Routes from "./routes";
import Log, { getLoggingMiddleware } from "./logger";
import {
  getFriendlyHTTPError, isProduction, loadEnv,
} from "./util/server-util";
import getSessionMiddleware from "./session-mw";
import { loadCerts, loadServingCerts } from "./util/certs";
import { setupPassport } from "./oauth";
import KubeWrapper from "./lib/kube/kube-wrapper";
import { addCustomExtensions, send405 } from "./express-extends";

/* eslint-disable spaced-comment */

async function main(): Promise<void> {
  Log.info(`NODE_ENV=${process.env.NODE_ENV}`);
  Log.info(`Running in ${isProduction() ? "PRODUCTION" : "DEVELOPMENT"} mode`);

  if (!isProduction()) {
    await loadEnv(".env");
    await loadEnv(".env.local");
  }

  // The containerfile build must use these same paths for static assets
  const FRONTEND_ROOT_DIR = isProduction() ? "client" : path.join("..", "..", "build");

  // const FRONTEND_ROOT_DIR = "client";
  const frontendPath = path.join(__dirname, FRONTEND_ROOT_DIR);
  Log.info(`Frontend path is ${frontendPath}`);
  const indexHtmlPath = path.join(frontendPath, "index.html");

  const PLUGIN_ROOT_DIR = "plugin";
  const pluginPath = path.join(__dirname, PLUGIN_ROOT_DIR);
  Log.info(`Plugin path is ${pluginPath}`);

  await loadCerts();
  await KubeWrapper.initialize();

  const app = express();

  //////////////////////// Middleware ////////////////////////

  // Remember order is significant

  /*
  app.use((req, res, next) => {
    // Redirect http traffic to https
    if (!req.secure) {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    return next();
  });
  */

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(getLoggingMiddleware());

  // const allowedOrigins = getAllowedOrigins();
  // Log.info(`Allow origins: ${allowedOrigins.join(" ")}`);
  app.use(cors({
    // origin: allowedOrigins,
    allowedHeaders: [ "X-CSRFToken" ],
  }));

  app.use(getSessionMiddleware());

  addCustomExtensions(app);

  // must run after kubewrapper, after custom extensions, and after session MW.
  // but before all routes and static assets
  await setupPassport(app);

  ///// Serve static assets in production mode /////

  if (isProduction()) {
    [ frontendPath, pluginPath ].forEach((staticPath) => {
    // const staticPath = path.join(__dirname, staticRelPath);
      Log.info(`Statically serving "${staticPath}"`);
      app.use(express.static(staticPath));
    });
  }

  //////////////////////// Routes ////////////////////////

  // All 'regular' routes are in this object and we add them all at once.
  Object.values(Routes).forEach((router) => {
    app.use(router);
  });

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

  app.route("/health")
    .get((req, res, next) => sendHealth(res))
    .all(send405([ "GET" ]));

  app.route(ApiEndpoints.Health.path)
    .get((req, res, next) => sendHealth(res))
    .all(send405([ "GET" ]));

  //////////////////////// Error handlers ////////////////////////

  // catch 404
  app.use(async (req, res, next) => {

    if (req.path.startsWith(ApiEndpoints.Root.path)) {
      return res.sendError(404, `No route at ${req.url}`);
    }
    else if (req.method === "GET") {
      return res.sendFile(indexHtmlPath);
    }
    return res.sendError(404, `Cannot ${req.method} ${req.url}`);
  });

  // fallback error handler
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

    res.sendError(500, message, "danger", false);
  });

  //////////////////////// Start listening ////////////////////////

  Log.info(`Trusting first proxy`);
  app.set("trust proxy", 1);

  /*
  const httpPort = process.env.BACKEND_HTTP_PORT || 3003;

  Log.info(`HTTP Port is ${httpPort}`);

  http.createServer(app).listen(httpPort)
    .on("listening", () => {
      Log.info(`HTTP listening on port ${httpPort}`);
    })
    .on("error", (err) => {
      Log.fatal(`Failed to start HTTP server`, err);
    });
  */

  Log.info(`Starting HTTPS server`);

  const httpsPort = process.env.BACKEND_HTTPS_PORT || 3443;
  Log.info(`HTTPS Port is ${httpsPort}`);

  try {
    const servingCertData = await loadServingCerts();

    https.createServer(servingCertData, app).listen(httpsPort)
      .on("listening", () => {
        Log.info(`HTTPS listening on port ${httpsPort}`);
      })
      .on("error", (err) => {
        Log.error(`Failed to start HTTPS server`, err);
      });
  }
  catch (err) {
    Log.fatal(`Failed to start HTTPS server:`, err);
  }

}

function sendHealth(res: express.Response<ApiResponses.Result>): void {
  res.json({ success: true, message: "OK" });
}

main()
  .then(() => {
    Log.info("main() finished");
  })
  .catch((err) => {
    Log.error("Error in top level of application:", err);
    // process.exit(1);
  });
