import { components } from "@octokit/openapi-types/dist-types/index";

import {
  GitHubAppConfig,
  GitHubAppManifest,
  GitHubAppUrls,
} from "./types/github-app";

export namespace ApiResponses {

  export type Result = { success: boolean, message: string };

  export interface SimpleError {
    success: false;
    title: string;
    message: string;
  }

  // https://tools.ietf.org/html/rfc7807#section-3.1
  export interface Error {
    success: false,
    detail: string,
    type?: string,
    title: string,
    status: number,
    statusMessage: string,
    // instance: string,
  }

  export interface CreateAppResponse {
    manifest: GitHubAppManifest;
    state: string;
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

  export interface ServiceAccountStateSetup {
    serviceAccountSetup: true;
    serviceAccount: {
      name: string;
      // exists: boolean;
      // https://docs.openshift.com/container-platform/4.7/authentication/using-rbac.html#default-roles_using-rbac
      // canCreateDeployment: boolean;
    };
  }

  export interface ServiceAccountStateNotSetup {
    serviceAccountSetup: false;
  }

  export type ServiceAccountState = ServiceAccountStateSetup | ServiceAccountStateNotSetup;

  export type ServiceAccountExists = Result & {
    serviceAccountName: string;
  };
}

export default ApiResponses;
