import express from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import ApiResponses from "common/api-responses";
import HttpConstants from "common/http-constants";
import Log from "server/logger";

export function sendError(
  res: express.Response, statusCode: StatusCodes, detail: string, severity: "warning" | "danger" = "danger",
  log: boolean = true
): void {
  const statusMessage = getReasonPhrase(statusCode);

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

  res.header("Content-Type", "application/problem+json").json(resBody);
}

export const send405 = (allowed: HttpConstants.Methods[]) => (
  (req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    const allowedStr = allowed.join(", ").toUpperCase();

    res.setHeader("Allow", allowedStr);
    sendError(res, 405, `${req.method} ${req.url} not allowed. Allow ${allowedStr}`);
  }
);
