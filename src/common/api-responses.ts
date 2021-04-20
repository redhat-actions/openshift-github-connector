import { Severity } from "./common-util";
import {
  GitHubAppUrls,
  GitHubAppConfig,
  GitHubAppInstallation,
  GitHubRepo,
  GitHubActionsSecret,
  GitHubRepoId,
} from "./types/github-types";

export namespace ApiResponses {

  export interface Result {
    success: boolean,
    message: string,
  }

  // https://tools.ietf.org/html/rfc7807#section-3.1
  // but 'message' instead of 'detail'
  export interface Error extends Result {
    success: false,
    type?: string,
    title: string,
    status: number,
    statusMessage: string,
    // instance: string,
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

  export interface GitHubAppRepos {
    app: true,
    repos: GitHubRepo[],
  }

  export type GitHubAppReposState = GitHubAppMissing | GitHubAppRepos;

  export interface DefaultSecrets {
    count: number,
    defaultSecrets: {
      clusterServerUrl: string,
      token: string,
    },
  }

  export interface RepoWithSecrets {
    repo: GitHubRepo,
    secrets: GitHubActionsSecret[],
  }

  export interface ReposWithSecrets {
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

  export interface RepoSecretsCreationSummary extends Result {
    successes?: RepoSecretCreationSuccess[],
    failures?: RepoSecretCreationFailure[],
    severity: Severity,
  }

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
  }

  export type ClusterState = ClusterStateDisconnected | ClusterStateConnected;

  // export interface ServiceAccountStateSetup extends Result {
  //   success: true;
  //   serviceAccountName: string
  // }

  // export interface ServiceAccountStateNotSetup extends Result {
  //   success: false;
  // }

  // export type ServiceAccountState = ServiceAccountStateSetup | ServiceAccountStateNotSetup;
}

export default ApiResponses;
