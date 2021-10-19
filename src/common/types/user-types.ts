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

export interface ConnectorGitHubUserInfo {
  /**
   * GitHub user ID
   */
  readonly id: number,
  /**
   * GitHub user name (login)
   */
  readonly name: string,
  readonly email: string | undefined,
  /**
   * Whether the user is a regular user or an organization
   */
  readonly type: GitHubUserType,
  readonly html_url: string,
}

export interface ConnectorGitHubAppInstallInfo {
  readonly installation: GitHubAppInstallationData,
  readonly installedApp: GitHubAppConfigNoSecrets,
  // installationId: number,
}

export interface ConnectorUserInfo extends OpenShiftUserInfo {
  readonly githubInfo?: ConnectorGitHubUserInfo,
  readonly githubInstallationInfo?: ConnectorGitHubAppInstallInfo,
  readonly ownsAppIds: number[],
  readonly hasCompletedSetup: boolean,
}
