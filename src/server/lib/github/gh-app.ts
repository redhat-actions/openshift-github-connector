import { Octokit } from "@octokit/core";

import Log from "server/logger";
import {
  GitHubAppOwnerUrls,
  GitHubAppConfig,
  GitHubAppInstallationData,
  GitHubAppConfigNoSecrets,
} from "common/types/gh-types";


class GitHubApp {

  public readonly urls: GitHubAppOwnerUrls;
  // private readonly authorizedUsers: number[];

  public constructor(
    public readonly githubHostname: string,
    public readonly config: GitHubAppConfig,
    public readonly octokit: Octokit,
  ) {
    this.urls = {
      app: config.html_url,
      avatar: `https://${githubHostname}/identicons/app/app/${config.slug}`,
      newInstallation: config.html_url + "/installations/new",
      settings: `https://${githubHostname}/settings/apps/${config.slug}`,
      permissions: `https://${githubHostname}/settings/apps/${config.slug}/permissions`,
      ownerInstallations: `https://${githubHostname}/settings/apps/${config.slug}/installations`,
    };

    // this.authorizedUsers = [this.config.owner.id];
  }

  public static async getAppConfig(octokit: Octokit): Promise<GitHubAppConfigNoSecrets> {
    Log.info(`Get app config`);
    return (await octokit.request("GET /app")).data as GitHubAppConfigNoSecrets;
  }

  public async getInstallations(): Promise<GitHubAppInstallationData[]> {
    const installationsReq = this.octokit.request("GET /app/installations");
    const installations = (await installationsReq).data;
    return installations;
  }

  public get id(): number {
    return this.config.id;
  }

  public get ownerId(): number {
    return this.config.owner.id;
  }

  public get getWithoutSecrets(): GitHubAppConfigNoSecrets {
    const cfg: Partial<GitHubAppConfig> = { ...this.config };
    delete cfg.client_id;
    delete cfg.client_secret;
    delete cfg.pem;
    delete cfg.webhook_secret;

    return cfg as GitHubAppConfigNoSecrets;
  }
}

export default GitHubApp;
