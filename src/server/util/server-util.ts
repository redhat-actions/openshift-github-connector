import { Stringable } from "common/common-util";
import HttpConstants from "common/http-constants";
import dotenv from "dotenv";
import fs from "fs/promises";
import fetch, { RequestInit, Response } from "node-fetch";
import Log from "server/logger";

/*
export function getAllowedOrigins(): string[] {
  return [
    getFrontendOrigin(os.hostname()),
    getFrontendOrigin("localhost"),
  ];
}
*/

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/*
export function isInCluster(): boolean {
  return !!process.env.KUBERNETES_PORT;
}
*/

export function removeTrailingSlash(s: string): string {
  if (s.endsWith("/")) {
    return s.substring(0, s.length - 1);
  }
  return s;
}

/*
export function getServerUrl(req: express.Request, includePath: boolean = false): string {
  let reqPath = "/";
  if (includePath) {
    reqPath = req.url;
  }

  const serverUrl = removeTrailingSlash(`${req.protocol}://${req.get("Host")}${reqPath}`);
  Log.info(`Server URL is ${serverUrl}`);
  return serverUrl;
}
*/

export function tob64(s: string): string {
  return Buffer.from(s).toString("base64");
}

export function fromb64(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8");
}

// https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
// basically, if T includes undefined values, AND keepUndefined, the return type will, too.
export function objValuesTob64<T>(obj: T, keepUndefined: true): { [key in keyof T]: string | undefined };
export function objValuesTob64<T>(obj: T, keepUndefined: false): { [key in keyof T]: string };

export function objValuesTob64<T extends Record<string, Stringable | undefined>>(
  obj: Record<string, Stringable | undefined>, keepUndefined: boolean
): { [key in keyof T]: string | undefined } {

  const result: Record<keyof T, string | undefined> = Object();
  Object.entries(obj).forEach(([ k, v ]) => {
    const key = k as keyof T;
    if (v === undefined) {
      if (keepUndefined) {
        result[key] = undefined;
      }
      // else, ignore
    }
    else {
      result[key] = tob64(v.toString());
    }
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

export function getFriendlyHTTPError(err: Error & { response?: any }): Error {
  if (!err.response) {
    return err;
  }

  const errRes = err.response;

  let betterMessage: string;
  if (!errRes.request && err.response.data) {
    betterMessage = `${errRes.status ?? "Unknown status"} ${errRes.url}: ${errRes.data.message ?? "Unknown cause"}`;
  }
  else {
    betterMessage = `${errRes.request?.method} ${errRes.request?.uri.href}: `
      + `${errRes.statusCode} ${errRes.body?.message || errRes.body?.reason}`;
  }

  const betterError = new Error(betterMessage);
  betterError.stack = err.stack?.replace(err.message, betterMessage);
  return betterError;
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
    const err = new Error(errMsg);
    (err as any).status = res.status;
    throw err;
  }
}

/*
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

export function deleteKey<T extends Record<string, unknown>, K extends string>(obj: T, key: K): Omit<T, K> {
  const partial: Partial<T> = obj;
  delete partial[key];

  return partial as Omit<T, typeof key>;
}
*/

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

export async function fileExists(filePath: string, warn: boolean = false): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  }
  catch (err) {
    if (warn) {
      Log.warn(`${filePath} does not exist.`);
    }
    return false;
  }
}

export async function loadEnv(envPath: string): Promise<void> {
  if (!await fileExists(envPath, true)) {
    return;
  }

  const result = dotenv.config({ path: envPath });
  if (result.parsed) {
    Log.info(`Loaded ${envPath}`, result.parsed);
  }
  else if (result.error) {
    Log.error(`Failed to load ${envPath}`, result.error);
  }
}

const CLUSTER_API_SERVER_URL = "https://openshift.default/";

export async function fetchFromOpenShiftApiServer(
  path: string,
  authorization?: string,
  options?: RequestInit
): Promise<unknown> {
  const url = CLUSTER_API_SERVER_URL + path;

  Log.info(`${options?.method ?? "GET"} ${url}`);

  // const insecureTrustApiServer = process.env.INSECURE_TRUST_APISERVER_CERT === "true";

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: authorization ?? "",
      [HttpConstants.Headers.ContentType]: HttpConstants.ContentTypes.Json,
    },
    // agent: new https.Agent({
    // rejectUnauthorized: !insecureTrustApiServer,
    // }),
  });

  await throwIfError(response);

  return response.json();
}
