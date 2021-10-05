import { Severity } from "./common-util";
import {
  GitHubAppConfigNoSecrets, GitHubAppInstallationData, GitHubAppInstallationUrls, GitHubAppOwnerUrls,
  GitHubAppPublicData, GitHubRepo, GitHubRepoId,
  GitHubUserDetails, RepoWithSecrets,
} from "./types/gh-types";
import ImageRegistry from "./types/image-registries";
import { ConnectorUserInfo } from "./types/user-types";
import { WorkflowIDs } from "./workflows/workflows";

namespace ApiResponses {

  export interface Result {
    success: boolean,
    message: string,
  }

  export interface ResultWithSeverity extends Result {
    severity: Severity,
  }

  export interface ResultSuccess extends Result {
    success: true,
    severity?: "success" | "info",
  }

  export interface ResultFailed extends Result {
    success: false,
    severity?: "warning" | "danger",
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
    appName: string,
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

  export type ClusterAppState = {
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

  type OpenShiftUser = ConnectorUserInfo & ResultSuccess;
  export type UserResponse = OpenShiftUser | ResultFailed;

  // extending githubuser type here in case we want to add more fields to this response later

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GitHubUserDetailsResponse extends GitHubUserDetails {

  }

  export interface GitHubAppRepos {
    app: true,
    repos: GitHubRepo[],
  }

  export type GitHubAppReposState = GitHubAppMissing | GitHubAppRepos;

  export interface ReposSecretsStatus {
    // orgs: [{
    //   org: GitHubOrg;
    //   secrets: GitHubActionsOrgSecret[];
    // }],
    // DEFAULT_SECRET_NAMES: DefaultSecrets,
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
    serviceAccount: {
      created: boolean,
      name: string,
      namespace: string,
      role: string,
    },
    successes?: RepoSecretCreationSuccess[],
    failures?: RepoSecretCreationFailure[],
  }

  export interface WorkflowCreationResultSuccess extends ResultSuccess {
    id: WorkflowIDs,
    repo: GitHubRepoId,
    createdSecrets: string[],
    prNumber: number,
    urls: {
      pullRequest: string,
      // repo: string,
      secrets: string,
      workflowFile: string,
    },
  }

  export type WorkflowCreationResult = ResultFailed | WorkflowCreationResultSuccess;

  export interface ClusterStateDisconnected {
    connected: false,
    error: string,
  }

  export interface ClusterConfig {
    externalServer: string,
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

  export interface UserNamespaces {
    namespaces: string[],
  }

  export interface UserNamespacedServiceAccounts {
    namespace: string,
    serviceAccounts: string[],
  }

  interface ImageRegistryCreationSuccess extends ResultSuccess {
    registry: ImageRegistry.Info,
  }

  export type ImageRegistryCreationResult = ImageRegistryCreationSuccess | ResultFailed;

  interface ImageRegistryListSuccess extends ResultSuccess {
    registries: ImageRegistry.List,
    registryPasswordSecretName: string,
  }

  export type ImageRegistryListResult = ImageRegistryListSuccess | ResultFailed;
}

export default ApiResponses;
