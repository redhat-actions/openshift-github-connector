import express from "express";
import HttpStatusCodes, { StatusCodes } from "http-status-codes";

import ApiResponses from "common/api-responses";
import HttpConstants from "common/http-constants";
import Log from "server/logger";
import UserInstallation from "./lib/github/user-app-installation";
import UserSerializer from "./lib/user/user-serializer";
import User from "./lib/user/user";

// use express.d.ts to extend the req/res objects for each of these new functions.

export function addCustomExtensions(app: express.Express): void {
  Log.info(`Add custom extensions`);
  app.use(sendStatus);
  app.use(sendError);
  app.use(send401);

  app.use(getUserOr401);
  app.use(getInstallationOr400);
}

const sendStatus = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  // Log.info(`Override res.sendStatus`);

  res.sendStatus = (code: StatusCodes): express.Response<ApiResponses.Result> => {
    res.status(code);

    // Log.info(`sendStatus ${code}`);

    const message = code + " " + HttpStatusCodes.getStatusText(code);

    if (req.header(HttpConstants.Headers.Accept)?.includes(HttpConstants.ContentTypes.Json)) {
      const resBody: ApiResponses.Result = {
        message,
        // status: statusCode,
        success: true,
      };
      // Log.info(`sendStatus body ${JSON.stringify(resBody)}`);

      return res.json(resBody);
    }

    // Log.info(`sendStatus message ${JSON.stringify(message)}`);
    // else, text/plain
    return res.send(message);
  };

  next();
};

const sendError = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  // Log.info(`Add res.sendError`);

  res.sendError = (
    statusCode: StatusCodes,
    detail: string,
    severity: "warning" | "danger" = "danger",
    log: boolean = true
  ) => {
    const statusMessage = HttpStatusCodes.getStatusText(statusCode);

    if (log) {
      Log.warn(`Error ${statusCode} ${statusMessage}: ${detail}`);
    }
    res.status(statusCode);

    const resBody: ApiResponses.ResultFailed = {
      success: false,
      message: detail,
      status: statusCode,
      statusMessage,
      severity,
    };

    res
      // .header(HttpConstants.Headers.ContentType, HttpConstants.ContentTypes.Problem)
      .header(HttpConstants.Headers.ContentType, HttpConstants.ContentTypes.Json)
      .json(resBody);
  };

  next();
};

const send401 = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  // Log.info(`Add res.send401`);

  res.send401 = () => {
    return res.sendError(401, `Authentication required to access ${req.path}`);
  };

  next();
};

export const send405 = (allowed: HttpConstants.Methods[]) => (
  (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const allowedStr = allowed.join(", ").toUpperCase();

    res
      .header(HttpConstants.Headers.Allow, allowedStr)
      .sendError(405, `${req.method} ${req.url} not allowed. Allow ${allowedStr}`);
  }
);

const getUserOr401 = (req: express.Request, res: express.Response, next: express.NextFunction): void => {

  req.getUserOr401 = async (die: boolean = true): Promise<User | undefined> => {

    if (!req.session.user) {
      if (die) {
        res.send401();
      }
      return undefined;
    }

    Log.debug(`Lookup user ${req.session.user.info.uid}`);

    const user = await UserSerializer.load(req.session.user);
    if (!user) {
      Log.warn(`Failed to look up user with info ${JSON.stringify(req.session.user.info)}. Clearing session`);
      req.session.user = undefined;

      if (die) {
        res.send401();
      }
      return undefined;
    }

    return user;
  };

  next();
};

const getInstallationOr400 = (req: express.Request, res: express.Response, next: express.NextFunction): void => {

  req.getInstallationOr400 = async (die: boolean = true): Promise<UserInstallation | undefined> => {

    const user = await req.getUserOr401(die);
    if (!user) {
      return undefined;
    }

    Log.debug(`Get installation for user ${user.name}`);

    if (!user.installation) {
      if (die) {
        res.sendError(
          400, `No GitHub app installation for OpenShift user ${user.name}.
          Use the Setup wizard to install a GitHub App to use this feature.`
        );
      }
      return undefined;
    }

    return user.installation;
  };

  next();
};
