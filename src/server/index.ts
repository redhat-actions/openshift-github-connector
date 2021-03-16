import "source-map-support/register";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import path from "path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createEngine as createReactEngine } from "express-react-views";

import Routes from "./routes";
import Views from "../views/util/views";
import { sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "../lib/logger";
import { startup } from "./startup";

const app = express();

const isDev = process.env.NODE_ENV === "dev";
const reactViewEnv = isDev ? "development" : "";
Log.info(`Is dev mode ? ${isDev}`);
if (isDev) {
    app.set("env", reactViewEnv);
}

const publicDir = path.join(__dirname, "..", "..", "public");
// https://github.com/reactjs/express-react-views/issues/79
const viewsDir = path.resolve(__dirname, "..", "views");
// viewEngine = "tsx";
const viewEngine = "js";

Log.info(`Using ${viewEngine} as view engine from directory ${viewsDir}`);
Log.info(`Static resources from ${publicDir}`);

app.set("views", viewsDir);
app.engine(viewEngine, createReactEngine({ settings: { env: reactViewEnv } }));
app.set("view engine", viewEngine);
// app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(morgan("dev"));
app.use(getLoggingMiddleware());
app.use(express.static(publicDir));

Object.values(Routes).map((router) => app.use(router));

// catch 404
app.use((req, res, next) => res.status(404).render(Views.NotFound, { path: req.path }));

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Log.error(`Uncaught error:`, err);

    const message = err.message || err.toString();
    sendError(res, 500, message, false);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT)
    .on("listening", () => {
        Log.info(`Listening on port ${PORT}`);
    }).on("error", (err) => {
        Log.fatal(`Failed to start HTTP server`, err);
    });

startup().catch((err) => {
    Log.error(`Uncaught startup error`, err);
});
