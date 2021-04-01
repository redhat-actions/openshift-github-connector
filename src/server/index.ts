import "source-map-support/register";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import createMemoryStore from "memorystore";
import { v4 as uuid } from "uuid";

import Routes from "./routes";
import { send405, sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "./logger";
import { startup } from "./startup";
import ApiEndpoints from "../common/api-endpoints";
import { getAllowedOrigins, isInK8s } from "./util";

const app = express();

// const isDev = process.env.NODE_ENV === "dev";
// const reactViewEnv = isDev ? "development" : "";
// Log.info(`Is dev mode ? ${isDev}`);
// if (isDev) {
//     app.set("env", reactViewEnv);
// }

// const publicDir = path.join(process.cwd(), "public");
// Log.info(`Static resources from ${publicDir}`);
// app.use(express.static(publicDir));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = getAllowedOrigins();
Log.info(`Allow origins: ${allowedOrigins.join(" ")}`);
app.use(cors({
  origin: allowedOrigins,
}));

// app.use(morgan("dev"));
app.use(getLoggingMiddleware());

const dayMs = 1000 * 60 * 60 * 24;
const MemoryStore = createMemoryStore(session);
app.use(session({
  // replace w/ set-once kube secret
  secret: "-IM64IG8SgvAYvp082R3aJOy",
  store: new MemoryStore({ checkPeriod: dayMs }),
  resave: false,
  saveUninitialized: true,
  genid: (req): string => {
    const id = uuid();
    // since the session id is also used for the secret name,
    // we have to transform it so it can be part of a k8s resource name
    // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names

    // uuid v4 is safe to use without modification.
    return id;
  },
  cookie: {
    httpOnly: true,
    maxAge: dayMs,
    // name: ""
    // sameSite: "lax",  // strict
    sameSite: false,
    // secure: "auto",
    secure: false,
  },
}));

Log.info(`In k8s=${isInK8s()}`);

if (isInK8s()) {
  Log.info(`Trusting first proxy`);
  app.set("trust proxy", 1);
}

Object.values(Routes).map((router) => app.use(router));

app.route("/").get((req, res, next) => {
  res.send(`Hello! This is the app root. The API is at ${ApiEndpoints.Api.path}`);
}).all(send405([ "GET" ]));

app.route(ApiEndpoints.Api.path).get((req, res, next) => {
  res.send(`Hello! This is the API root.`);
}).all(send405([ "GET" ]));

const sendHealth = (res: express.Response): void => {
  res.json({ status: "OK" });
};

app.route("/health")
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

app.route(ApiEndpoints.Health.path)
  .get((req, res, next) => sendHealth(res))
  .all(send405([ "GET" ]));

// catch 404
// app.use((req, res, next) => res.status(404).render(Views.NotFound, { path: req.path }));
app.use((req, res, next) => sendError(res, 404, `No route at ${req.url}`));

// error handler
app.use((err_: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const err = { ...err_ };

  if (err.response) {
    // delete http response data that results in a nasty long log
    delete err.response._readableState;
    delete err.response._events;
    delete err.response_eventsCount;
    delete err.response._eventsCount;
    delete err.response.socket;
    delete err.response.client;
  }
  Log.error(`Uncaught error:`, err);

  const message = err.message || err.toString();
  sendError(res, 500, message, "Error", false);
});

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
