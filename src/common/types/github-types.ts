import { components } from "@octokit/openapi-types/dist-types/index";

// we "extract" a series of types from the GitHub schemas, so they're easier to find and reduce imports.

// an organization can also be a simple-user
export type GitHubUser = NonNullable<components["schemas"]["simple-user"]>;
export type GitHubOrg = components["schemas"]["organization-simple"];
export type GitHubRepo = components["schemas"]["repository"] & { owner: GitHubUser };
export type GitHubAppInstallation = components["schemas"]["installation"];
export type GitHubActionsSecret = components["schemas"]["actions-secret"];
export type GitHubActionsOrgSecret = components["schemas"]["organization-actions-secret"];
export type RepoSecretsPublicKey = components["schemas"]["actions-public-key"];
// slug and owner types are optional in the Config type but always present, so we intersect to make them non-null.
export type GitHubAppConfig = components["schemas"]["integration"] & { slug: string, owner: GitHubUser };

// https://docs.github.com/en/rest/reference/repos#get-repository-content
export type GitHubContentFile = components["schemas"]["content-file"];
export type GitHubContentDirectory = components["schemas"]["content-directory"];
export type GitHubContentSymlink = components["schemas"]["content-symlink"];
export type GitHubContentSubmodule = components["schemas"]["content-submodule"];

// This is the response type from GET /repos/{owner}/{repo}/contents/{path}
export type GitHubContentType =
  GitHubContentFile | GitHubContentDirectory | GitHubContentSymlink | GitHubContentSubmodule;

export function isGitHubFileContentType(data: GitHubContentType): data is GitHubContentFile {
  if (Array.isArray(data)) {
    // exclude directory type which is an array
    return false;
  }

  return data.type === "file";
}

// The API is structured as /repos/{owner}/{name}/<path>
// so you can't just use the repo Id as a unique identifier, which is a bummer.
export interface GitHubRepoId {
  /**
   * The ID is (shockingly) not really used in the GitHub API.
   * But, we use it internally as a unique identifier, since repos can be moved.
   */
  id: number,
  /**
   * Owner name, such as "tetchel" or "redhat-actions". Get from .owner.login
   */
  owner: string,
  /**
   * Repository name. Remember repositories can be renamed or moved.
   */
  name: string,

  full_name: string,
}

/* eslint-disable camelcase */
export type GitHubAppConfigSecrets = {
  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,
};

export type GitHubOAuthResponse = {
  access_token: string,
  expires_in: number,
  refresh_token: string,
  refresh_token_expires_in: number,
  scope: string,
  token_type: string,
};
/* eslint-enable camelcase */

export type GitHubAppConfigWithSecrets = GitHubAppConfig & GitHubAppConfigSecrets;

export interface GitHubAppUrls {
  /**
   * The public facing page describing the app
   */
  readonly app: string,
  /**
   * The app settings page (eg change permissions, webhooks)
   */
  readonly settings: string,
  /**
   * App settings permissions and events page
   */
  readonly permissions: string,
  /**
   * The page from which the creator can install the app
   */
  readonly install: string,
  /**
   * The page from which the user can manage their installation
   */
  readonly installationSettings: string,
}
