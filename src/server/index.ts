import "source-map-support/register";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import path from "path";

import Routes from "./routes";
import { send405, sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "./logger";
import { startup } from "./startup";
import ApiEndpoints from "../common/api-endpoints";

const app = express();

/*
const isDev = process.env.NODE_ENV === "dev";
const reactViewEnv = isDev ? "development" : "";
Log.info(`Is dev mode ? ${isDev}`);
if (isDev) {
    app.set("env", reactViewEnv);
}*/

const publicDir = path.join(process.cwd(), "public");
Log.info(`Static resources from ${publicDir}`);
app.use(express.static(publicDir));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(morgan("dev"));
app.use(getLoggingMiddleware());

Object.values(Routes).map((router) => app.use(router));

app.route(ApiEndpoints.Api.path).get((req, res, next) => {
  res.send(`Hello! This is the API root.`);
}).all(send405([ "GET" ]));

const sendHealth = (res: express.Response): void => {
  res.json({ status: "OK" });
};

app.route(ApiEndpoints.Health.path)
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

// catch 404
// app.use((req, res, next) => res.status(404).render(Views.NotFound, { path: req.path }));
app.use((req, res, next) => sendError(res, 404, `No route at ${req.url}`));

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Log.error(`Uncaught error:`, err);

  const message = err.message || err.toString();
  sendError(res, 500, message, undefined, false);
});

const PORT = process.env.PORT || 3003;

app.listen(PORT)
  .on("listening", () => {
    Log.info(`Listening on port ${PORT}`);
  }).on("error", (err) => {
    Log.fatal(`Failed to start HTTP server`, err);
  });

startup().catch((err) => {
  Log.error(`Uncaught startup error`, err);
});
