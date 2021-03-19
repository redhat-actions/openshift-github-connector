import { GitHubAppConfigNoSecrets, GitHubAppManifest, GitHubAppUrls } from "./github-app";

export namespace ApiResponses {

  // https://tools.ietf.org/html/rfc7807#section-3.1
  export interface Error {
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
    appConfig: GitHubAppConfigNoSecrets,
    appUrls: GitHubAppUrls,
    installations: any,
    repositories: any,
  }

  export type GitHubAppState = GitHubAppMissingState | GitHubAppReadyState;

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
    namespace: string | undefined;
  }

  export type ClusterState = ClusterStateDisconnected | ClusterStateConnected;
}

export default ApiResponses;
