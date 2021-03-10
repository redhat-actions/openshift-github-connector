import express from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";

export function sendError(res: express.Response, statusCode: StatusCodes, message: string, log: boolean = true): void {
    const statusMsg = getReasonPhrase(statusCode);

    if (log) {
        console.warn(`Error ${statusCode} error: ${message}`);
    }
    res.status(statusCode);
    res.render("error", { message, statusCode, statusMsg });
}

export const send405 = (allowed: string[]) => (
    (req: express.Request, res: express.Response, _next: express.NextFunction): void => {
        const allowedStr = allowed.join(", ").toUpperCase();

        res.setHeader("Allow", allowedStr);
        sendError(res, 405, `Method ${req.method} not allowed. Allow ${allowedStr}`);
    }
);
