import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";

import Log from "../../logger";
import { GitHubAppConfig, GitHubAppUrls } from "../../../common/types/github-app";
import GitHubAppMemento from "./app-memento";

const GITHUB_HOST = "github.com";

class GitHubApp {
    private static _instance: GitHubApp | undefined;

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

    public static async create(memento: GitHubAppMemento, save: boolean = false): Promise<GitHubApp> {
        if (this._instance) {
            Log.warn(`githubApp already exists; recreating`);
        }

        Log.info(`First line of private key is ${memento.privateKey.split("\n")[0]}`);

        const app = new App({
            appId: memento.appId,
            privateKey: memento.privateKey,
            // oauth: {
                // clientId: appConfig.client_id,
                // clientSecret: appConfig.client_secret,
            // },
            // webhooks: {
                // secret: appConfig.webhook_secret,
            // },
        });

        const config = (await app.octokit.request("GET /app")).data as GitHubAppConfig;

        const installationIdNum = Number(memento.installationId);
        const installOctokit = await app.getInstallationOctokit(installationIdNum);

        this._instance = new GitHubApp(
            config,
            app.octokit,
            installOctokit,
            installationIdNum,
        );

        if (save) {
            await GitHubAppMemento.save(memento);
        }

        return this._instance;
    }
}

export default GitHubApp;
