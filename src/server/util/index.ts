import express from "express";
import { KubeHttpError } from "../lib/kube/kube-wrapper";

export function getServerUrl(req: express.Request, includePath: boolean = false): string {
    let reqPath = "/";
    if (includePath) {
        reqPath = req.url;
    }

    return `${req.protocol}://${req.get("Host")}${reqPath}`;
}

/**
 * Transform an HTTP error eg. from the K8s library into something readable.
 */
export function getFriendlyHTTPError(err: KubeHttpError): string {
    const errRes = err.response;
    return `${errRes.request.method} ${errRes.request.uri.href}: `
        + `${errRes.statusCode} ${errRes.body.message || errRes.body.reason}`;
}
