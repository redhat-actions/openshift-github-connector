import express from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../common/interfaces/api-types";
import Log from "../logger";

export function sendError(
  res: express.Response, statusCode: StatusCodes, detail: string, title?: string, log: boolean = true
): void {
  const statusMessage = getReasonPhrase(statusCode);

  if (log) {
    Log.warn(`Error ${statusCode} error: ${detail}`);
  }
  res.status(statusCode);

  const resBody: ErrorResponse = {
    detail,
    status: statusCode,
    statusMessage,
    title: title ?? "Error",
  };

  res.header("Content-Type", "application/problem+json").json(resBody);
}

export const send405 = (allowed: string[]) => (
  (req: express.Request, res: express.Response, _next: express.NextFunction): void => {
    const allowedStr = allowed.join(", ").toUpperCase();

    res.setHeader("Allow", allowedStr);
    sendError(res, 405, `${req.method} ${req.url} not allowed. Allow ${allowedStr}`, "Not allowed");
  }
);
