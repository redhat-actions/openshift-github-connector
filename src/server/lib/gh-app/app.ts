import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "../../logger";
import { GitHubAppConfig, GitHubAppUrls } from "../../../common/types/github-app";
import GitHubAppMemento from "./app-memento";

const GITHUB_HOST = "github.com";

class GitHubApp {
    private static appsMap = new Map<string, GitHubApp>();

    public readonly urls: GitHubAppUrls;

    constructor(
        public readonly config: GitHubAppConfig,
        public readonly octokit: Octokit,
        public readonly installationOctokit: Octokit,
        public readonly installationID: number,
    ) {
        this.urls = {
            app: config.html_url,
            settings: `https://${GITHUB_HOST}/settings/apps/${config.slug}`,
            permissions: `https://github.com/settings/apps/${config.slug}/permissions`,
            install: `https://${GITHUB_HOST}/settings/apps/${config.slug}/installations`,
            installationSettings: `https://${GITHUB_HOST}/settings/installations/${installationID}`,
        };
    }

    public static async getAppForSession(sessionID: string): Promise<GitHubApp | undefined> {
        const inMap = this.appsMap.get(sessionID);
        if (inMap) {
            return inMap;
        }

        const memento = await GitHubAppMemento.tryLoad(sessionID);
        if (!memento) {
            Log.info(`No app for session ${sessionID}`);
            return undefined;
        }
        else if (!memento.installationId) {
            Log.info(`App for session ${sessionID} has not been installed yet`);
            return undefined;
        }

        return this.create(sessionID, memento);
    }

    private static async getApp(memento: GitHubAppMemento): Promise<App> {
        return new App({
            appId: memento.appId,
            privateKey: memento.privateKey,
            // oauth: {
                // clientId: appConfig.client_id,
                // clientSecret: appConfig.client_secret,
            // },
            webhooks: {
                secret: memento.webhookSecret,
            },
        });
    }

    private static async getAppConfig(ghApp: App): Promise<GitHubAppConfig> {
        return (await ghApp.octokit.request("GET /app")).data as GitHubAppConfig;
    }

    public static async create(sessionID: string, memento: GitHubAppMemento): Promise<GitHubApp> {
        const ghAppObj = await this.getApp(memento);
        const config = await this.getAppConfig(ghAppObj);

        const installationIdNum = Number(memento.installationId);
        const installOctokit = await ghAppObj.getInstallationOctokit(installationIdNum);

        const app = new GitHubApp(
            config,
            ghAppObj.octokit,
            installOctokit,
            installationIdNum,
        );

        this.appsMap.set(sessionID, app);

        return app;
    }

    public static async delete(sessionId: string) {
        if (this.appsMap.has(sessionId)) {
            Log.info(`Delete ${sessionId} from apps map`)
            this.appsMap.delete(sessionId);
        }
        else {
            Log.error(`Requested to delete ${sessionId} from apps map, but it was not found`);
        }
    }
}

export default GitHubApp;
