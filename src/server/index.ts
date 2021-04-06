import "source-map-support/register";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";

import sessionMw from "./session-mw";
import Routes from "./routes";
import { send405, sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "./logger";
import { startup } from "./startup";
import ApiEndpoints from "../common/api-endpoints";
import { getAllowedOrigins, isInK8s } from "./util/server-util";

const app = express();

// Middleware runs in the order in which they are added here //

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(getLoggingMiddleware());

Log.info(`In k8s=${isInK8s()}`);

if (isInK8s()) {
  Log.info(`Trusting first proxy`);
  app.set("trust proxy", 1);
}

const allowedOrigins = getAllowedOrigins();
Log.info(`Allow origins: ${allowedOrigins.join(" ")}`);
app.use(cors({
  origin: allowedOrigins,
}));

app.use(sessionMw);

// Routes here - Put middleware above //

Object.values(Routes).map((router) => app.use(router));

app.route("/")
  .get((req, res, next) => {
    res.send(`Hello! This is the app root. The API is at ${ApiEndpoints.Api.path}`);
  })
  .all(send405([ "GET" ]));

app.route(ApiEndpoints.Api.path)
  .get((req, res, next) => {
    res.send(`Hello! This is the API root.`);
  })
  .all(send405([ "GET" ]));

const sendHealth = (res: express.Response): void => {
  res.json({ status: "OK" });
};

app.route("/health")
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

app.route(ApiEndpoints.Health.path)
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

// End routes - Error handlers here //

// catch 404
// app.use((req, res, next) => res.status(404).render(Views.NotFound, { path: req.path }));
app.use((req, res, next) => sendError(res, 404, `No route at ${req.url}`));

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Log.error(`Uncaught error:`, err);

  let message = err.message || err.toString();
  if (message === "[object Object]") {
    message = JSON.stringify(err);
  }

  sendError(res, 500, message, "Error", false);
});

// Start server once all middleware are in place //

const port = process.env.PORT || process.env.BACKEND_PORT || 3003;

Log.info(`Port is ${port}`);
app.listen(port)
  .on("listening", () => {
    Log.info(`Listening on port ${port}`);
  }).on("error", (err) => {
    Log.fatal(`Failed to start HTTP server`, err);
  });

startup()
  .then(() => {
    Log.info(`Finished startup`);
  })
  .catch((err) => {
    Log.error(`Uncaught startup error`, err);
  });
