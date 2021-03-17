import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "../../logger";
import { GitHubAppConfig, GitHubAppConfigNoSecrets, GitHubAppUrls } from "../../../common/interfaces/github-app";
import GitHubAppMemento from "./app-memento";
import { getConfigWithoutSecrets } from "./app-config";

const GITHUB_HOST = "github.com";

class GitHubApp {
    private static _instance: GitHubApp | undefined;

    public readonly urls: GitHubAppUrls;

    public readonly configNoSecrets: GitHubAppConfigNoSecrets;

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

        this.configNoSecrets = getConfigWithoutSecrets(config);
    }

    public static isInitialized(): boolean {
        return !!this._instance;
    }

    public static get instance(): GitHubApp {
        if (!this._instance) {
            throw new Error(`GitHubApp instance requested before created`);
        }
        return this._instance;
    }

    public static delete(): void {
        this._instance = undefined;
    }

    public static async create(appConfig: GitHubAppConfig, installationID: number): Promise<GitHubApp> {
        if (this._instance) {
            Log.warn(`githubApp already exists; recreating`);
        }

        Log.info(`Creating github app instance ${appConfig.name}`);

        const app = new App({
            appId: appConfig.id,
            privateKey: appConfig.pem,
            oauth: {
                clientId: appConfig.client_id,
                clientSecret: appConfig.client_secret,
            },
            webhooks: {
                secret: appConfig.webhook_secret,
            },
        });

        const installOctokit = await app.getInstallationOctokit(installationID);

        this._instance = new GitHubApp(
            appConfig,
            app.octokit,
            installOctokit,
            installationID,
        );

        await GitHubAppMemento.save(this._instance);

        return this._instance;
    }
}

export default GitHubApp;
