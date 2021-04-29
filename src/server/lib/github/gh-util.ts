import express from "express";
import { Octokit } from "@octokit/core";
import sodium from "tweetsodium";

import Log from "server/logger";
import ApiResponses from "common/api-responses";
import { sendError } from "server/util/send-error";
import { GitHubOAuthResponse, GitHubRepoId, GitHubUserData, RepoSecretsPublicKey } from "common/types/github-types";
import HttpConstants from "common/http-constants";
import fetch from "node-fetch";
import { throwIfError } from "server/util/server-util";

export async function getGitHubHostname(): Promise<string> {
  return "github.com";
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

export async function exchangeCodeForUserData(
  client_id: string, client_secret: string, oauthCode: string
): Promise<GitHubUserData> {
  const githubReqBody = JSON.stringify({
    client_id,
    client_secret,
    code: oauthCode,
    // state ?
  });

  // https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#response
  const oauthRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: HttpConstants.getJSONContentHeaders(githubReqBody),
    body: githubReqBody,
  });

  await throwIfError(oauthRes);

  const oauthData: GitHubOAuthResponse = await oauthRes.json();

  const userDataRes = await fetch(
    "https://api.github.com/user",
    { headers: { Authorization: `token ${oauthData.access_token} ` } }
  );

  if (!userDataRes.ok) {
    // eslint-disable-next-line camelcase
    const err = await userDataRes.json() as { message: string, documentation_url: string };
    throw new Error(err.message);
  }

  const userData: GitHubUserData = await userDataRes.json();
  return userData;
}
