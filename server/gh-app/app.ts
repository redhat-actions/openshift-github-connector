import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import GitHubAppConfig, { GitHubAppConfigNoSecrets } from "./app-config";
import GitHubAppMemento from "./app-memento";

const GITHUB_HOST = "github.com";

interface GitHubAppUrls {
    /**
     * The public facing page describing the app
     */
    readonly app: string;
    /**
     * The app settings page (eg change permissions, webhooks)
     */
    readonly settings: string;
    /**
     * App settings permissions and events page
     */
    readonly permissions: string;
    /**
     * The page from which the creator can install the app
     */
    readonly install: string;
    /**
     * The page from which the user can manage their installation
     */
    readonly installationSettings: string;
}

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

        this.configNoSecrets = GitHubAppConfig.getConfigWithoutSecrets(config);
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

    public static async create(appConfig: GitHubAppConfig, installationID: number): Promise<GitHubApp> {
        if (this._instance) {
            console.warn(`githubApp already exists; recreating`);
        }

        console.log(`Creating github app instance ${appConfig.name}`);

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
