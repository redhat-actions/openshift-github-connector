import express from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import Views from "../../views/util/views";
import Log from "../../lib/logger";
import { ErrorPageProps } from "../../views/errors/error";

export function sendError(res: express.Response, statusCode: StatusCodes, message: string, log: boolean = true): void {
    const statusMessage = getReasonPhrase(statusCode);

    if (log) {
        Log.warn(`Error ${statusCode} error: ${message}`);
    }
    res.status(statusCode);

    const props: ErrorPageProps = {
        message,
        statusCode,
        statusMessage,
    };
    res.render(Views.Error, props);
}

export const send405 = (allowed: string[]) => (
    (req: express.Request, res: express.Response, _next: express.NextFunction): void => {
        const allowedStr = allowed.join(", ").toUpperCase();

        res.setHeader("Allow", allowedStr);
        sendError(res, 405, `Method ${req.method} not allowed. Allow ${allowedStr}`);
    }
);
