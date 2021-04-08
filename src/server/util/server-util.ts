import express from "express";
import os from "os";
import { URL } from "url";
import HttpStatusCodes from "http-status-codes";

import Log from "../logger";

export function getFrontendUrl(req: express.Request): string {
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

export function getServerUrl(req: express.Request, includePath: boolean = false): string {
  let reqPath = "/";
  if (includePath) {
    reqPath = req.url;
  }

  const serverUrl = removeTrailingSlash(`${req.protocol}://${req.get("Host")}${reqPath}`);
  Log.info(`Server URL is ${serverUrl}`);
  return serverUrl;
}

export function getClientUrl(req: express.Request): string {
  const proto = req.secure ? "https" : "http";
  // this may fail if the request is cross-origin
  const host = req.header("X-Forwarded-Host") || req.header("Host");
  const clientUrl = `${proto}://${host}`;
  Log.info(`Client URL is ${clientUrl}`);
  return clientUrl;
}

export function tob64(s: string): string {
  return Buffer.from(s).toString("base64");
}

export function fromb64(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8");
}

export function isInK8s(): boolean {
  return process.env.IN_K8S === "true";
}

export function sendStatusJSON(res: express.Response, statusCode: number): void {
  res.status(statusCode).send({ statusCode, message: HttpStatusCodes.getStatusText(statusCode) });
}

export function getFriendlyHTTPError(err: Error & { response?: any }): Error {
  if (!err.response) {
    return new Error(JSON.stringify(err));
  }

  const errRes = err.response;
  const message = `${errRes.request.method} ${errRes.request.uri.href}: `
        + `${errRes.statusCode} ${errRes.body.message || errRes.body.reason}`;

  const newErr = new Error(message);
  newErr.stack = err.stack;
  return newErr;
}

/*
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function removeErrorGarbage(err_: any): Record<string, unknown> {
  const err = { ...err_ };

  if (err.response) {
    // delete http response data that results in a nasty long log
    delete err.response._readableState;
    delete err.response._events;
    delete err.response_eventsCount;
    delete err.response._eventsCount;
    delete err.response.socket;
    delete err.response.client;
    delete err.response.req;
  }

  return err;
}
*/
