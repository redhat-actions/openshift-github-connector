export type GitHubAppManifest = Record<string, unknown>;

/* eslint-disable camelcase */
export type GitHubAppConfig = Readonly<{
  id: number,
  slug: string,
  node_id: string
  owner: {
    login: string,
    id: number,
    node_id: string,
    avatar_url: string,
    gravatar_id: string,
    url: string,
    html_url: string,
    followers_url: string,
    following_url: string,
    gists_url: string,
    starred_url: string,
    subscriptions_url: string,
    organizations_url: string,
    repos_url: string,
    events_url: string,
    received_events_url: string,
    type: string,
    site_admin: boolean
  },
  name: string,
  description: string,
  external_url: string,
  html_url: string,
  created_at: string,     // iso date format
  updated_at: string,     // iso date format
  permissions: {
    [key: string]: "read" | "write";
  },
  events: string[]
}>;

export type GitHubAppConfigSecrets = {
  // client_id: string;
  // client_secret: string;
  pem: string;
  webhook_secret: string;
};

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
