import { GitHubAppConfigNoSecrets, GitHubAppManifest, GitHubAppUrls } from "./github-app";

// https://tools.ietf.org/html/rfc7807#section-3.1
export interface ErrorResponse {
    detail: string,
    type?: string,
    title: string,
    status: number,
    statusMessage: string,
    // instance: string,
}

export interface AppPageStateNoApp {
    app: false;
}

export interface AppPageStateReady {
    app: true;
    appConfig: GitHubAppConfigNoSecrets,
    appUrls: GitHubAppUrls,
    installations: any,
    repositories: any,
}

export type AppPageState = AppPageStateNoApp | AppPageStateReady;

export interface CreateAppResponse {
    manifest: GitHubAppManifest;
    state: string;
}
