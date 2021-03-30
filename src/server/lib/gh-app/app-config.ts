import fetch from "node-fetch";
import ApiEndpoints from "../../../common/api-endpoints";
import Log from "../../logger";
import { GitHubAppConfig, GitHubAppManifest } from "../../../common/types/github-app";

// https://stackoverflow.com/questions/42999983/typescript-removing-readonly-modifier
// type Writeable<T> = { -readonly [K in keyof T]: T[K] };

export async function exchangeCodeForAppConfig(code: string): Promise<GitHubAppConfig> {
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

export const CLIENT_CALLBACK_QUERYPARAM = `client_callback`;

export function getAppManifest(serverUrl: string, clientUrl: string): GitHubAppManifest {
    const clientCallback = `${clientUrl}/app`;

    // eslint-disable-next-line camelcase
    const setup_url = serverUrl + ApiEndpoints.Setup.PostInstallApp.path +
        `?${CLIENT_CALLBACK_QUERYPARAM}=${clientCallback}`;

    // eslint-disable-next-line camelcase
    const redirect_url = serverUrl + ApiEndpoints.Setup.PostCreateApp.path;
    const incomingWebhookUrl = serverUrl + ApiEndpoints.Webhook.path;

    // https://docs.github.com/en/developers/apps/creating-a-github-app-from-a-manifest#github-app-manifest-parameters
    // the following parameters can also be in this payload
    // https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-configuration-parameters
    return {
        name: "OpenShift Actions Connector",
        description: "Connect your OpenShift cluster to GitHub Actions",
        url: "https://github.com/redhat-actions",
        hook_attributes: {
            url: incomingWebhookUrl,
        },
        request_oauth_on_install: true,
        callback_url: setup_url,
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

/*
export function getConfigWithoutSecrets(config: GitHubAppConfig): GitHubAppConfigNoSecrets {
    const configNoSecrets = { ...config } as Partial<Writeable<GitHubAppConfig>>;
    delete configNoSecrets.client_id;
    delete configNoSecrets.client_secret;
    delete configNoSecrets.pem;
    delete configNoSecrets.webhook_secret;

    return configNoSecrets as GitHubAppConfigNoSecrets;
}
*/
