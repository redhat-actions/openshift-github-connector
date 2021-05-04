import fetch from "node-fetch";
import Log from "server/logger";
import { GitHubAppConfig } from "common/types/gh-types";
import { getFriendlyHTTPError } from "server/util/server-util";

// https://stackoverflow.com/questions/42999983/typescript-removing-readonly-modifier
// type Writeable<T> = { -readonly [K in keyof T]: T[K] };

export async function exchangeCodeForAppConfig(code: string): Promise<GitHubAppConfig> {
  Log.info(`Exchanging code for app config...`);
  const codeConvertUrl = `https://api.github.com/app-manifests/${code}/conversions`;

  const convertResponse = await fetch(codeConvertUrl, { method: "POST" });

  const config: GitHubAppConfig | undefined = await convertResponse.json();

  if (config == null) {
    const err = new Error(`Failed to convert code to GitHub App config`);
    throw getFriendlyHTTPError({ ...err, ...convertResponse });
  }

  Log.info(`Obtained app config for "${config.name}"`);
  return config;
}
