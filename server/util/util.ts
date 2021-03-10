import express from "express";

export function getServerUrl(req: express.Request, includePath: boolean): string {
    let reqPath = "/";
    if (includePath) {
        reqPath = req.url;
    }

    return `${req.protocol}://${req.get("Host")}${reqPath}`;
}
