import fetch from "node-fetch";
import Endpoints from "../../../common/endpoints";
import Log from "../../logger";
import { GitHubAppConfig, GitHubAppConfigNoSecrets } from "../../../common/interfaces/github-app";

// https://stackoverflow.com/questions/42999983/typescript-removing-readonly-modifier
type Writeable<T> = { -readonly [K in keyof T]: T[K] };

export async function createAppConfig(code: string): Promise<GitHubAppConfig> {
    Log.info(`Exchanging code for app config...`);
    const codeConvertUrl = `https://api.github.com/app-manifests/${code}/conversions`;

    const convertResponse = await fetch(codeConvertUrl, { method: "POST" });

    const config: GitHubAppConfig | undefined = await convertResponse.json();

    if (config == null) {
        throw new Error("Failed to get app config!");
    }

    Log.info(`Obtained app config for "${config.name}"`);
    return config;
}

export function getAppManifest(serverUrl: string): Record<string, unknown> {
    let serverUrlNoSlash = serverUrl;
    if (serverUrlNoSlash.endsWith("/")) {
        serverUrlNoSlash = serverUrlNoSlash.substring(0, serverUrlNoSlash.length - 1);
    }

    // eslint-disable-next-line camelcase
    const setup_url = serverUrlNoSlash + Endpoints.Setup.PostInstallApp;
    // eslint-disable-next-line camelcase
    const redirect_url = serverUrlNoSlash + Endpoints.Setup.PostCreateApp;

    // https://docs.github.com/en/developers/apps/creating-a-github-app-from-a-manifest#github-app-manifest-parameters
    // Tthe following parameters can also be in this payload
    // https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-configuration-parameters
    return {
        name: "OpenShift Actions Connector",
        description: "Connect your OpenShift cluster to GitHub Actions",
        url: "https://github.com/redhat-actions",
        hook_attributes: {
            url: serverUrlNoSlash + Endpoints.Webhook,
        },
        // request_oauth_on_install: true,
        setup_url,
        redirect_url,
        setup_on_update: true,
        public: false,
        default_permissions: {
            actions: "write",
            secrets: "write",
        },
        default_events: [
            "workflow_run",
        ],
    };
}

export function getConfigWithoutSecrets(config: GitHubAppConfig): GitHubAppConfigNoSecrets {
    const configNoSecrets = { ...config } as Partial<Writeable<GitHubAppConfig>>;
    delete configNoSecrets.client_id;
    delete configNoSecrets.client_secret;
    delete configNoSecrets.pem;
    delete configNoSecrets.webhook_secret;

    return configNoSecrets as GitHubAppConfigNoSecrets;
}
