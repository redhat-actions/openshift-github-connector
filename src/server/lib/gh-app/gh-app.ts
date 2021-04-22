import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "server/logger";
import { GitHubAppUrls, GitHubAppConfig, GitHubRepo } from "common/types/github-types";
import GitHubAppMemento from "server/lib/memento/app-memento";
import GitHubUserMemento from "server/lib/memento/user-memento";

const GITHUB_HOST = "github.com";

class GitHubApp {
    public readonly urls: GitHubAppUrls;

    constructor(
        public readonly config: GitHubAppConfig,
        public readonly octokit: Octokit,

        public readonly install: {
            octokit: Octokit,
            id: number,
        }
    ) {
        this.urls = {
            app: config.html_url,
            settings: `https://${GITHUB_HOST}/settings/apps/${config.slug}`,
            permissions: `https://github.com/settings/apps/${config.slug}/permissions`,
            install: `https://${GITHUB_HOST}/settings/apps/${config.slug}/installations`,
            installationSettings: `https://${GITHUB_HOST}/settings/installations/${install.id}`,
        };
    }

    public static async getAppForUser(userId: string): Promise<GitHubApp | undefined> {
        const userMemento = await GitHubUserMemento.loadUser(userId);
        if (!userMemento) {
            Log.info(`No user data for session`);
            return undefined;
        }

        const appMemento = await GitHubAppMemento.loadApp(userMemento.appId);

        if (!appMemento) {
            Log.info(`No app for session`);
            return undefined;
        }

        return this.create(appMemento, userMemento);
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
                secret: memento.webhook_secret,
            },
            log: {
                debug: Log.debug,
                error: Log.error,
                info: Log.info,
                warn: Log.warn,
            },
        });
    }

    private static async getAppConfig(ghApp: App): Promise<GitHubAppConfig> {
        return (await ghApp.octokit.request("GET /app")).data as GitHubAppConfig;
    }

    public static async create(appMemento: GitHubAppMemento, userMemento: GitHubUserMemento): Promise<GitHubApp> {
        const ghAppObj = await this.getApp(appMemento);
        const config = await this.getAppConfig(ghAppObj);

        const installationIdNum = Number(userMemento.installationId);
        const installOctokit = await ghAppObj.getInstallationOctokit(installationIdNum);

        const app = new GitHubApp(
            config,
            ghAppObj.octokit, {
                octokit: installOctokit,
                id: installationIdNum
            },
        );

        return app;
    }

    public static async delete() {
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    public async getAccessibleRepos(): Promise<GitHubRepo[]> {
        const repositoriesReq = this.install.octokit.request("GET /installation/repositories");
        const repositories: GitHubRepo[] = (await repositoriesReq).data.repositories;

        return repositories;
    }
}

export default GitHubApp;
