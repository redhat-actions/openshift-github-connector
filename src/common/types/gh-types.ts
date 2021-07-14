import { components } from "@octokit/openapi-types/types";

// we "extract" a series of types from the GitHub schemas, so they're easier to find and reduce imports.
/* eslint-disable camelcase */

// an organization can also be a simple-user
export type GitHubUserDetails = NonNullable<components["schemas"]["simple-user"]>;
export type GitHubUserType = "Organization" | "User";
export type GitHubOrg = components["schemas"]["organization-simple"];
export type GitHubRepo = components["schemas"]["repository"] & { owner: GitHubUserDetails };
export type GitHubAppInstallationData = components["schemas"]["installation"];
export type GitHubActionsSecret = components["schemas"]["actions-secret"];
export type GitHubActionsOrgSecret = components["schemas"]["organization-actions-secret"];
export type RepoSecretsPublicKey = components["schemas"]["actions-public-key"];
export type InstallationToken = components["schemas"]["installation-token"];
export type GitHubAppPermissions = components["schemas"]["app-permissions"];

export type WebhookReqBody = components["schemas"]["hook"];

export interface GitHubAppConfigSecrets {
  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,
}

export interface GitHubAppAuthData extends GitHubAppConfigSecrets {
  id: number,
}

export type GitHubOAuthResponse = {
  access_token: string,
  expires_in: number,
  refresh_token: string,
  refresh_token_expires_in: number,
  scope: string,
  token_type: string,
};

export type GitHubAppConfig = components["schemas"]["integration"] & GitHubAppConfigSecrets & {
  // some keys are inexplicably marked optional
  slug: string,
  owner: GitHubUserDetails,
};

export type GitHubAppConfigNoSecrets = Exclude<GitHubAppConfig, keyof GitHubAppConfigSecrets>;
// export type GitHubAppConfigNoSecrets = GitHubAppConfig;

export type GitHubAppPublicData = {
  id: number,
  name: string,
  slug: string,
  html_url: string,
};

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

export function getSecretsUrlForRepo(repo: { html_url: string }): string {
  return repo.html_url + "/settings/secrets/actions";
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

export interface GitHubAppOwnerUrls {
  /**
   * The public facing page describing the app
   */
  readonly app: string,
  readonly avatar: string,
  /**
   * The page from which anyone can install a public app
   */
  readonly newInstallation: string,
  /**
   * The app settings page (eg change permissions, webhooks)
   */
  readonly settings: string,
  /**
   * App settings permissions and events page
   */
  readonly permissions: string,
  /**
   * The page from which the creator can manage installations
   */
  readonly ownerInstallations: string,
}

export interface GitHubAppInstallationUrls extends Pick<GitHubAppOwnerUrls, "app"> {
  /**
   * The page from which the user can manage their installation
   */
  readonly installationSettings: string,
}
