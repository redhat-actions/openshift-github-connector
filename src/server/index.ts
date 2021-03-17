import "source-map-support/register";
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import path from "path";

import Routes from "./routes";
import { send405, sendError } from "./util/send-error";
import Log, { getLoggingMiddleware } from "./logger";
import { startup } from "./startup";
import Paths from "../common/paths";

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

// https://github.com/reactjs/express-react-views/issues/79
// const viewsDir = path.resolve(__dirname, "..", "views");
// viewEngine = "tsx";
// const viewEngine = "js";

// Log.info(`Using ${viewEngine} as view engine from directory ${viewsDir}`);

// app.set("views", viewsDir);
// app.engine(viewEngine, createReactEngine({ settings: { env: reactViewEnv } }));
// app.set("view engine", viewEngine);
// app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(morgan("dev"));
app.use(getLoggingMiddleware());

Object.values(Routes).map((router) => app.use(router));

app.route("/").get((req, res, next) => {
    // res.sendFile(path.join(publicDir, "index.html"));
    res.send("Hello!");
}).all(send405([ "GET" ]));

app.route(Paths.Health)
    .get((req, res, next) => res.json({ status: "OK" }))
    .all(send405([ "GET" ]));

// catch 404
// app.use((req, res, next) => res.status(404).render(Views.NotFound, { path: req.path }));
app.use((req, res, next) => sendError(res, 404, `No page at ${req.url}`));

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
