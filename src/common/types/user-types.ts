import {
  GitHubAppConfigNoSecrets,
  GitHubAppInstallationData, GitHubUserType,
} from "./gh-types";

export interface OpenShiftUserInfo {
  /**
   * User's OpenShift username
   */
  readonly name: string,
  /**
    * User's OpenShift UID
    */
  readonly uid: string,
  /**
    * If the user has permissions to administrate the Connector
    */
  readonly isAdmin: boolean,
}

export type ConnectorGitHubUserInfo = Readonly<{
  /**
   * GitHub user ID
   */
  id: number,
  /**
   * GitHub user name (login)
   */
  name: string,
  email: string | undefined,
  /**
   * Whether the user is a regular user or an organization
   */
  type: GitHubUserType,
  html_url: string,
}>;

export type ConnectorGitHubAppInstallInfo = Readonly<{
  installation: GitHubAppInstallationData,
  installedApp: GitHubAppConfigNoSecrets,
  // installationId: number,
}>;

export interface ConnectorUserInfo extends OpenShiftUserInfo {
  readonly githubInfo?: ConnectorGitHubUserInfo,
  readonly githubInstallationInfo?: ConnectorGitHubAppInstallInfo,
  readonly ownsAppIds: number[],
}
