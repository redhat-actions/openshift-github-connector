import express from "express";
import { Octokit } from "@octokit/core";
import sodium from "tweetsodium";

import Log from "../../logger";
import ApiResponses from "../../../common/api-responses";
import { sendError } from "../../util/send-error";
import GitHubApp from "./gh-app";
import { GitHubRepoId, RepoSecretsPublicKey } from "../../../common/types/github-types";

/**
 * Tries to get the GitHub App for the user bound to the given request's session.
 * If it fails, sends a 400 response and returns undefined.
 * In the failure case, the caller should exit the request handler since a response has been sent.
 */
export async function getAppForSession(req: express.Request, res: express.Response): Promise<GitHubApp | undefined> {
  if (!req.session.data?.githubUserId) {
    sendError(res, 400, "No session cookie provided");
    return undefined;
  }

  const app = await GitHubApp.getAppForUser(req.session.data.githubUserId);
  if (app) {
    return app;
  }

  Log.info("App is not initialized");

  const resBody: ApiResponses.GitHubAppState = {
    app: false,
  };

  res.json(resBody);
  return undefined;
}

export async function getRepoSecretPublicKey(installOctokit: Octokit, repo: GitHubRepoId): Promise<RepoSecretsPublicKey> {
  Log.info(`Get public key for ${repo.owner}/${repo.name}`);

  const publicKeyRes = await installOctokit.request("GET /repos/{owner}/{repo}/actions/secrets/public-key", {
    owner: repo.owner,
    repo: repo.name,
  });

  Log.info(`Successfully got public key for ${repo.owner}/${repo.name}`);
  return publicKeyRes.data;
}

export async function createSecret(
  installOctokit: Octokit,
  repo: GitHubRepoId,
  repoPublicKey: RepoSecretsPublicKey,
  secretName: string,
  secretPlaintext: string
): Promise<void> {

  // Log.info(`Create Actions secret ${secretName} into ${repo.owner}/${repo.name}`);

  // https://docs.github.com/en/rest/reference/actions#create-or-update-a-repository-secret

  const secretEncrypted = Buffer.from(
    sodium.seal(
      Buffer.from(secretPlaintext),
      Buffer.from(repoPublicKey.key, "base64")
    )
  ).toString("base64");

  await installOctokit.request(
    "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}", {
      owner: repo.owner,
      repo: repo.name,
      /* eslint-disable camelcase */
      secret_name: secretName,
      encrypted_value: secretEncrypted,
      key_id: repoPublicKey.key_id,
      /* eslint-enable camelcase */
    }
  );

  Log.info(`Successfully created ${secretName} in ${repo.owner}/${repo.name}`);
}
