import { Severity } from "./common-util";
import { DefaultSecrets } from "./default-secret-names";
import {
  GitHubAppOwnerUrls,
  GitHubAppInstallationData,
  GitHubRepo,
  GitHubActionsSecret,
  GitHubRepoId,
  GitHubUserData,
  GitHubAppInstallationUrls,
  GitHubAppPublicData,
  GitHubAppConfigNoSecrets,
} from "./types/gh-types";

namespace ApiResponses {

  export interface Result {
    success: boolean,
    message: string,
  }

  export interface ResultWithSeverity extends Result {
    severity: Severity,
  }

  export interface ResultSuccess extends ResultWithSeverity {
    success: true,
  }

  export interface ResultFailed extends ResultWithSeverity {
    success: false,
    severity: "warning" | "danger",
  }

  export interface Error extends ResultFailed {
    status: number,
    statusMessage: string,
  }

  // export interface CreateAppResponse {
  //   manifest: Record<string, unknown>;
  //   state: string;
  // }

  export interface CreatingAppResponse extends Result {
    appInstallUrl: string,
  }

  export interface ExistingAppData {
    // client_id: string,
    appId: number,
    appUrl: string,
    avatarUrl: string,
    created_at: string,
    name: string,
    newInstallationUrl: string,
    owner: {
      avatar_url: string,
      login: string,
      html_url: string,
    },
  }

  export type AllAppsState = {
    success: true,
    totalCount: number,
    visibleApps: ExistingAppData[],
  } | ResultFailed;

  export interface GitHubAppMissing extends Result {
    success: false,
  }

  export interface UserAppExists {
    // discriminators
    success: true,
    installed: boolean,
    owned: boolean,

    appData: GitHubAppPublicData,
  }

  export interface UserOwnedAppData {
    appConfig: GitHubAppConfigNoSecrets,
    ownerUrls: GitHubAppOwnerUrls,
    installations: GitHubAppInstallationData[],
  }

  export interface UserAppOwned extends UserAppExists {
    owned: true,
    installed: false,

    ownedAppData: UserOwnedAppData,
  }

  export interface UserAppInstalledData {
    installation: GitHubAppInstallationData,
    installUrls: GitHubAppInstallationUrls,
    repos: GitHubRepo[],
  }

  export interface UserAppInstalled extends UserAppExists {
    installed: true,
    owned: false,

    installedAppData: UserAppInstalledData,
  }

  export interface UserAppOwnedAndInstalled extends UserAppExists {
    installed: true,
    owned: true,

    installedAppData: UserAppInstalledData,
    ownedAppData: UserOwnedAppData,
  }

  export type UserAppState = GitHubAppMissing | UserAppOwned | UserAppInstalled | UserAppOwnedAndInstalled;

  export interface RemovalResult extends Result {
    removed: boolean,
  }

  // extending githubuser type here in case we want to add more fields to this response later

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GitHubUserResponse extends GitHubUserData {

  }

  export interface GitHubAppRepos {
    app: true,
    repos: GitHubRepo[],
  }

  export type GitHubAppReposState = GitHubAppMissing | GitHubAppRepos;

  export interface RepoWithSecrets {
    repo: GitHubRepo,
    hasClusterSecrets: boolean,
    hasRegistrySecret: boolean,
    secrets: GitHubActionsSecret[],
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultSecretsResponse extends DefaultSecrets {

  }

  export interface ReposSecretsStatus {
    // orgs: [{
    //   org: GitHubOrg;
    //   secrets: GitHubActionsOrgSecret[];
    // }],
    defaultSecretNames: DefaultSecrets,
    repos: RepoWithSecrets[],
    urls: GitHubAppInstallationUrls,
  }

  interface SingleRepoSecretCreationResult {
    success: boolean,
    repo: GitHubRepoId,
    actionsSecretName?: string,
    saTokenSecretName?: string,
  }

  export interface RepoSecretCreationSuccess extends SingleRepoSecretCreationResult {
    success: true,
    actionsSecretName: string,
  }

  export interface RepoSecretCreationFailure extends SingleRepoSecretCreationResult {
    success: false,
    err: string,
  }

  export interface RepoSecretsCreationSummary extends ResultWithSeverity {
    // serviceAccountSecrets: {
    //   secretName: string,
    //   created: boolean,
    // }[],
    successes?: RepoSecretCreationSuccess[],
    failures?: RepoSecretCreationFailure[],
  }

  export interface WorkflowCreationResultSuccess extends ResultSuccess {
    url: string,
  }

  export type WorkflowCreationResult = ResultFailed | WorkflowCreationResultSuccess;

  export interface ClusterStateDisconnected {
    connected: false,
    error: string,
  }

  export interface ClusterConfig {
    name: string,
    user: {
      name: string,
      // roles: string;
    },
    server: string,
  }

  export interface ClusterStateConnected {
    connected: true,
    clusterInfo: ClusterConfig,
    namespace: string,
    serviceAccountName: string,
  }

  export type ClusterState = ClusterStateDisconnected | ClusterStateConnected;

}

export default ApiResponses;
