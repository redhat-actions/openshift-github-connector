import express from "express";
import { URL } from "url";
import { KubeHttpError } from "../lib/kube/kube-wrapper";
import Log from "../logger";

export function getServerUrl(req: express.Request, includePath: boolean = false): string {
  let reqPath = "/";
  if (includePath) {
    reqPath = req.url;
  }

  const serverUrl = `${req.protocol}://${req.get("Host")}${reqPath}`;
  Log.info(`Server URL is ${serverUrl}`);
  return serverUrl;
}

export function getClientUrl(req: express.Request): string {
  const referrer = req.headers.referer;
  if (!referrer) {
    throw new Error(`Failed to get client URL; 'Referrer' header missing!`);
  }

  const clientUrl = new URL(referrer);
  clientUrl.pathname = "";

  const clientUrlStr = clientUrl.toString();
  Log.info(`Client URL is ${clientUrlStr}`);
  return clientUrlStr;
}

export function removeTrailingSlash(s: string): string {
  if (s.endsWith("/")) {
    return s.substring(0, s.length - 1);
  }
  return s;
}

/**
 * Transform an HTTP error eg. from the K8s library into something readable.
 */
export function getFriendlyHTTPError(err: KubeHttpError): string {
  const errRes = err.response;
  return `${errRes.request.method} ${errRes.request.uri.href}: `
        + `${errRes.statusCode} ${errRes.body.message || errRes.body.reason}`;
}
