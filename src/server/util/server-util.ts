import express from "express";
import os from "os";
import HttpStatusCodes from "http-status-codes";
import { Response } from "node-fetch";

import Log from "server/logger";
import ApiResponses from "common/api-responses";
import HttpConstants from "common/http-constants";
import { Stringable } from "common/common-util";

/*
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
*/

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

export function objValuesTob64<T extends Record<string, Stringable>>(obj: T): { [key in keyof T]: string } {
  const result: Record<keyof T, string> = Object();
  Object.entries(obj).forEach(([ k, v ]) => {
    const key = k as keyof T;
    result[key] = tob64(v.toString());
  });

  return result;
}

export function objValuesFromb64<T extends Record<string, string | undefined>>(obj: T): T {
  const result: Record<string, string> = {};
  Object.entries(obj).forEach(([ k, v ]) => {
    if (v != null) {
      result[k] = fromb64(v);
    }
  });

  return result as T;
}

/*
export function isInK8s(): boolean {
  return process.env.IN_K8S === "true";
}
*/

export function sendSuccessStatusJSON(res: express.Response, statusCode: number): void {
  const resBody: ApiResponses.Result = {
    message: statusCode + " " + HttpStatusCodes.getStatusText(statusCode),
    // status: statusCode,
    success: true,
  };

  res.status(statusCode).json(resBody);
}

export function getFriendlyHTTPError(err: Error & { response?: any }): Error {
  if (!err.response) {
    if (err.message) {
      return new Error(err.message);
    }
    return new Error(JSON.stringify(err));
  }

  const errRes = err.response;
  const message = `${errRes.request.method} ${errRes.request.uri.href}: `
        + `${errRes.statusCode} ${errRes.body.message || errRes.body.reason}`;

  const newErr = new Error(message);
  newErr.stack = err.stack;
  return newErr;
}

export async function getHttpError(res: Response): Promise<string> {
  let message: string;
  let statusMessage: string | undefined;
  if (res.headers.get(HttpConstants.Headers.ContentType)?.startsWith(HttpConstants.ContentTypes.Json)) {
    const resBody = await res.json();
    if (resBody.message) {
      message = resBody.message;
    }
    else {
      message = JSON.stringify(resBody);
    }

    if (message.startsWith("Error: ")) {
      message = message.substring("Error: ".length, message.length);
    }
  }
  else {
    message = await res.text();
  }

  return `${res.url} responded ${res.status}${statusMessage ? " " + statusMessage : ""}: ${message}`;
}

export async function throwIfError(res: Response): Promise<void> {
  if (res.status > 399) {
    const errMsg = await getHttpError(res);
    throw new Error(errMsg);
  }
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

// https://github.com/microsoft/TypeScript/issues/20965#issuecomment-354858633
type ValuesOf<T extends any[]> = T[number];

export function checkKeys<
  T extends Record<string | number, any>
>(obj: Partial<T>, ...keys: Array<keyof T>): obj is { [key in ValuesOf<typeof keys>]: any } {
  const missingKeys = keys.filter((key) => {
    const missing = obj[key] === undefined;
    if (missing) {
      Log.debug(`object is missing key "${key}"`);
    }
    return missing;
  });

  if (missingKeys.length > 0) {
    return false;
  }
  return true;
}

/**
 * @returns an error message describing why the name is invalid, or undefined if the name is valid.
 */
export function checkInvalidK8sName(name: string): string | undefined {
  // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names

  let subMsg;
  if (name.length > 253) {
    subMsg = `Too long.`;
  }
  else if (!name.match(/^[a-z0-9-_]*$/)) {
    subMsg = `Can only contain lowercase letters, digits, '-' and '_'`;
  }
  else if (!name.match(/^[a-z0-9].*[a-z0-9]$/)) {
    subMsg = `Must start and end with a lowercase letter or digit.`;
  }

  if (subMsg) {
    return `Invalid resource name: ${subMsg}`;
  }
  return undefined;
}

/**
 * Do our best to transform the given string into a valid k8s resource name.
 * Note that since it strips characters, names that were unique before may not be unique after this change.
 */
export function toValidK8sName(rawName: string): string {
  // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names

  let cookedName = rawName;
  const maxLength = 253;
  if (rawName.length > maxLength) {
    cookedName = rawName.substring(0, maxLength - 1);
  }

  cookedName = cookedName.replace(/[\s/.]/g, "-");
  cookedName = cookedName.toLowerCase();
  cookedName = cookedName.replace(/[^a-z0-9-_]/g, "");

  const alphaNumRx = /[a-z0-9]/;

  if (!alphaNumRx.test(cookedName[0])) {
    cookedName = "0" + cookedName;
  }
  if (!alphaNumRx.test(cookedName[cookedName.length - 1])) {
    cookedName += "0";
  }

  return cookedName;
}
