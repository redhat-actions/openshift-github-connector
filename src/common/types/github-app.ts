import { components } from "@octokit/openapi-types/dist-types/index";

export type GitHubUserData = NonNullable<components["schemas"]["simple-user"]>;

// slug and owner types are optional in the Config type but always present, so we intersect to make them non-null.
export type GitHubAppConfig = components["schemas"]["integration"] & { slug: string, owner: GitHubUserData };

/* eslint-disable camelcase */
export type GitHubAppConfigSecrets = {
  client_id: string;
  client_secret: string;
  pem: string;
  webhook_secret: string;
};

export type GitHubOAuthResponse = {
  access_token: string,
  expires_in: number,
  refresh_token: string,
  refresh_token_expires_in: number,
  scope: string,
  token_type: string
};
/* eslint-enable camelcase */

export type GitHubAppConfigWithSecrets = GitHubAppConfig & GitHubAppConfigSecrets;

export interface GitHubAppUrls {
  /**
   * The public facing page describing the app
   */
  readonly app: string;
  /**
   * The app settings page (eg change permissions, webhooks)
   */
  readonly settings: string;
  /**
   * App settings permissions and events page
   */
  readonly permissions: string;
  /**
   * The page from which the creator can install the app
   */
  readonly install: string;
  /**
   * The page from which the user can manage their installation
   */
  readonly installationSettings: string;
}
