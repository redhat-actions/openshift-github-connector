import express from "express";
import os from "os";
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
    throw new Error(`Failed to get client URL; 'Referer' header missing!`);
  }

  const clientUrl = new URL(referrer);
  clientUrl.pathname = "";

  const clientUrlStr = clientUrl.toString();
  Log.info(`Client URL is ${clientUrlStr}`);
  return clientUrlStr;
}

// These should be set by Containerfile in prod
const FRONTEND_PROTOCOL_ENVVAR = "FRONTEND_PROTOCOL";
const FRONTEND_PORT_ENVVAR = "FRONTEND_PORT";

const FRONTEND_PROTOCOL_DEFAULT = "http";
const FRONTEND_PORT_DEFAULT = "3000";

export function getFrontendOrigin(hostname: string): string {
  const frontendProtocol = process.env[FRONTEND_PROTOCOL_ENVVAR] || FRONTEND_PROTOCOL_DEFAULT;
  const frontendPort = process.env[FRONTEND_PORT_ENVVAR] || FRONTEND_PORT_DEFAULT;

  const frontendOrigin = `${frontendProtocol}://${hostname}:${frontendPort}`;
  return frontendOrigin;
}

export function getAllowedOrigins(): string[] {
  return [
    getFrontendOrigin(os.hostname()),
    getFrontendOrigin("localhost"),
  ];
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
