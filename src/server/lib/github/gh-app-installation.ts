import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";
import { GitHubAppInstallationData, GitHubAppInstallationUrls, GitHubRepo } from "common/types/github-types";
import GitHubApp from "server/lib/github/gh-app";
import Log from "server/logger";

export default class UserInstallation {

  public readonly urls: GitHubAppInstallationUrls;

  private constructor(
    public readonly app: GitHubApp,
    public readonly installationId: number,
    public readonly octokit: Octokit,
  ) {

    this.urls = {
      app: app.urls.app,
      installationSettings: `https://${this.app.githubHostname}/settings/installations/${this.installationId}`,
    };
  }

  public static async create(app: GitHubApp, installationId: number): Promise<UserInstallation> {
    const appObj = new App({
      appId: app.config.appId,
      privateKey: app.config.pem,
      webhooks: {
        secret: app.config.webhook_secret,
      },
      log: Log,
    });

    const installOctokit = await appObj.getInstallationOctokit(Number(installationId));

    return new this(app, installationId, installOctokit);
  }

  public async getRepos(): Promise<GitHubRepo[]> {
    const repositoriesReq = this.octokit.request("GET /installation/repositories");
    const repositories: GitHubRepo[] = (await repositoriesReq).data.repositories;

    return repositories;
  }

  public async getInstallation(): Promise<GitHubAppInstallationData> {
    const installationReq = await this.app.octokit.request(
      "GET /app/installations/{installation_id}", {
      installation_id: Number(this.installationId)
    });

    return installationReq.data;
  }
}
