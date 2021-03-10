import "source-map-support/register";
import express from "express";
import "express-async-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import indexRouter from "./routes/root-route";
import appRouter from "./routes/app-route";
import webhookRouter from "./routes/webhook-route";
import { sendError } from "./util/error";
import GitHubAppMemento from "./gh-app/app-memento";

const app = express();

const frontendRootDir = path.join(__dirname, "..", "client");
const viewsDir = path.join(frontendRootDir, "views");
const staticDir = path.join(frontendRootDir, "static");

app.set("views", viewsDir);
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(staticDir));
app.use(morgan("dev"));

app.use("/", indexRouter);
app.use(appRouter);
app.use(webhookRouter);

// catch 404
app.use((req, res, next) => res.status(404).render("404", { path: req.path }));

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const message = err.message || err.toString();
    console.error(`Uncaught error:`, err);
    sendError(res, 500, message, false);
});

// TODO find a better way to do this.
GitHubAppMemento.tryLoad()
    .then((githubApp) => {
        if (githubApp) {
            console.log(`Successfully loaded memento for app "${githubApp.config.name}"`);
        }
        else {
            console.log(`No app memento was loaded.`);
        }
    })
    .catch((err) => {
        console.warn(`Failed to load app memento`, err);
    });

console.log(`Finished starting server`);

export default app;
