import { Octokit } from "@octokit/core";
import { createAppAuth } from "@octokit/auth-app";
import { paginateRest, PaginateInterface } from "@octokit/plugin-paginate-rest";
import sodium from "tweetsodium";
import fetch from "node-fetch";

import Log from "server/logger";
import { GitHubAppAuthData, GitHubOAuthResponse, GitHubRepoId, GitHubUserDetails, RepoSecretsPublicKey } from "common/types/gh-types";
import HttpConstants from "common/http-constants";
import { throwIfError } from "server/util/server-util";

export async function getGitHubHostname(): Promise<string> {
  return "github.com";
}

export function getAppOctokit(appAuth: GitHubAppAuthData, installationId?: number): Octokit & {
  paginate: PaginateInterface,
} {

  Log.info(`Creating octokit for app ID ${appAuth.id}${installationId != null ? ` with installation ID ${installationId}`: ""}`);

  // the auth library uses different naming than the REST api :)
  const auth: Record<string, unknown> = {
    appId: appAuth.id,
    oauth: {
      clientId: appAuth.client_id,
      clientSecret: appAuth.client_secret
    },
    privateKey: appAuth.pem,
    webhooks: {
      secret: appAuth.webhook_secret,
    },
  };

  if (installationId) {
    auth.installationId = installationId;
  }

  // https://github.com/octokit/plugin-paginate-rest.js/
  const PaginateOctokit = Octokit.plugin(paginateRest);
  const octokit = new PaginateOctokit({
    authStrategy: createAppAuth,
    auth,
    log: Log,
  });

  return octokit;
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

export async function createActionsSecret(
  installOctokit: Octokit,
  repo: GitHubRepoId,
  secretName: string,
  secretPlaintext: string,
  repoPublicKey?: RepoSecretsPublicKey,
): Promise<void> {

  // Log.info(`Create Actions secret ${secretName} into ${repo.owner}/${repo.name}`);

  if (!repoPublicKey) {
    repoPublicKey = await getRepoSecretPublicKey(installOctokit, repo);
  }

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
): Promise<GitHubUserDetails> {
  const githubReqBody = JSON.stringify({
    client_id,
    client_secret,
    code: oauthCode,
    // state ?
  });

  // https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#response
  const oauthRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: HttpConstants.getJSONHeadersForReq(githubReqBody),
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

  const userData: GitHubUserDetails = await userDataRes.json();
  return userData;
}
