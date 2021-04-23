import { Severity } from "./common-util";
import { DefaultSecrets } from "./default-secret-names";
import {
  GitHubAppUrls,
  GitHubAppConfig,
  GitHubAppInstallation,
  GitHubRepo,
  GitHubActionsSecret,
  GitHubRepoId,
  GitHubUser,
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

  export interface GitHubAppMissing {
    app: false,
  }

  export interface GitHubAppReady {
    app: true,
    appConfig: GitHubAppConfig,
    appUrls: GitHubAppUrls,
    installations: GitHubAppInstallation[],
    repos: GitHubRepo[],
  }

  export type GitHubAppState = GitHubAppMissing | GitHubAppReady;

  // extending githubuser type here in case we want to add more fields to this response later

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GitHubUserResponse extends GitHubUser {

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
    urls: GitHubAppUrls,
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
