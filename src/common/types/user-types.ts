import { GitHubUserType } from "./gh-types";

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

export type GitHubUserInfo = Readonly<{
  /**
   * GitHub user ID
   */
  id: number,
  /**
   * GitHub user name (login)
   */
  name: string,
  /**
   * Whether the user is a regular user or an organization
   */
  type: GitHubUserType,
}>;

export type GitHubAppInstallInfo = Readonly<{
  appId: number,
  appName: string,
  installationId: number,
}>;

export interface ConnectorUserInfo extends OpenShiftUserInfo {
  readonly githubInfo?: GitHubUserInfo,
  readonly githubInstallationInfo?: GitHubAppInstallInfo,
}
