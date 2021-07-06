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
  readonly id: number,
  /**
   * GitHub user name (login)
   */
  readonly name: string,
  /**
   * Whether the user is a regular user or an organization
   */
  readonly type: GitHubUserType,
}>;

export interface ConnectorUserInfo extends OpenShiftUserInfo {
  readonly githubUserInfo?: GitHubUserInfo,
  readonly ownsApp: boolean,
  readonly hasInstallation: boolean,
}
