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
} from "./types/github-types";

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

  export interface GitHubAppMissing extends Result {
    success: false,
  }

  export interface GitHubAppSetup {
    // discriminators
    success: true,
    installed: boolean,
    owned: boolean,

    appData: GitHubAppPublicData,
  }

  export interface GitHubAppOwnedData {
    appConfig: GitHubAppConfigNoSecrets,
    ownerUrls: GitHubAppOwnerUrls,
    installations: GitHubAppInstallationData[],
  }

  export interface GitHubAppOwned extends GitHubAppSetup {
    owned: true,
    installed: false,

    ownedAppData: GitHubAppOwnedData,
  }

  export interface GitHubAppInstalledData {
    installation: GitHubAppInstallationData,
    installUrls: GitHubAppInstallationUrls,
    repos: GitHubRepo[],
  }

  export interface GitHubAppInstalled extends GitHubAppSetup {
    installed: true,
    owned: false,

    installedAppData: GitHubAppInstalledData,
  }

  export interface GitHubAppOwnedAndInstalled extends GitHubAppSetup {
    installed: true,
    owned: true,

    installedAppData: GitHubAppInstalledData,
    ownedAppData: GitHubAppOwnedData,
  }

  export type GitHubAppState = GitHubAppMissing | GitHubAppOwned | GitHubAppInstalled | GitHubAppOwnedAndInstalled;

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
