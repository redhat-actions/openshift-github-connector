import { components } from "@octokit/openapi-types/dist-types/index";

import {
  GitHubAppUrls,
  GitHubAppConfig,
} from "./types/github-app";

export namespace ApiResponses {

  export type Result = {
    success: boolean,
    message: string
  };

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
    appInstallUrl: string;
  }

  export interface GitHubAppMissingState {
    app: false;
  }

  export interface GitHubAppReadyState {
    app: true;
    appConfig: GitHubAppConfig,
    appUrls: GitHubAppUrls,
    installations: components["schemas"]["installation"][],
    repositories: components["schemas"]["repository"][],
  }

  export type GitHubAppState = GitHubAppMissingState | GitHubAppReadyState;

  /*
  export type GitHubAppRepos = {
    app: true;
    repos: components["schemas"]["repository"][]
  };

  export type GitHubAppReposState = GitHubAppMissingState | GitHubAppRepos;
  */

  export interface ClusterStateDisconnected {
    connected: false;
    error: string;
  }

  export interface ClusterConfig {
    name: string;
    user: string;
    server: string;
  }

  export interface ClusterStateConnected {
    connected: true;
    clusterInfo: ClusterConfig;
    namespace: string;
  }

  export type ClusterState = ClusterStateDisconnected | ClusterStateConnected;

  export interface ServiceAccountStateSetup extends Result {
    success: true;
    serviceAccountName: string
  }

  export interface ServiceAccountStateNotSetup extends Result {
    success: false;
  }

  export type ServiceAccountState = ServiceAccountStateSetup | ServiceAccountStateNotSetup;
}

export default ApiResponses;
