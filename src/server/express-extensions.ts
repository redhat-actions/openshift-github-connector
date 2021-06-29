import express from "express";
import HttpStatusCodes, { StatusCodes } from "http-status-codes";

import ApiResponses from "common/api-responses";
import HttpConstants from "common/http-constants";
import Log from "server/logger";

// use express.d.ts to extend the req/res objects for each of these new functions.

export function addCustomExtensions(app: express.Express): void {
  app.use(sendStatus);
  app.use(sendError);
  app.use(send401);
}

const sendStatus = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  res.sendStatus = (code: StatusCodes): express.Response => {
    res.status(code);

    const message = code + " " + HttpStatusCodes.getStatusText(code);

    if (req.header(HttpConstants.Headers.Accept)?.includes(HttpConstants.ContentTypes.Json)) {
      const resBody: ApiResponses.Result = {
        message,
        // status: statusCode,
        success: true,
      };

      return res.json(resBody);
    }

    // else, text/plain
    return res.send(message);
  };

  next();
};

const sendError = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
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

    const resBody: ApiResponses.Error = {
      success: false,
      message: detail,
      status: statusCode,
      statusMessage,
      severity,
    };

    res
      .header(HttpConstants.Headers.ContentType, HttpConstants.ContentTypes.Problem)
      .json(resBody);
  };

  next();
};

const send401 = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
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

/*
export const send405 = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  res.send405 = (allowed: HttpConstants.Methods[]) => {
    const allowedStr = allowed.join(", ").toUpperCase();

    res
      .header(HttpConstants.Headers.Allow, allowedStr)
      .sendError(405, `${req.method} ${req.url} not allowed. Allow ${allowedStr}`);
  };
};
*/
