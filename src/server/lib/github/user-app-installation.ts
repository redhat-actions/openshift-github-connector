import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";
import { GitHubAppInstallationData, GitHubAppInstallationUrls, GitHubRepo, GitHubUserType } from "common/types/github-types";
import GitHubApp from "server/lib/github/gh-app";
import Log from "server/logger";
import User from "../user";

export default class UserInstallation {

  public readonly urls: GitHubAppInstallationUrls;

  private constructor(
    public readonly user: User,
    public readonly app: GitHubApp,
    public readonly installationId: number,
    public readonly octokit: Octokit,
  ) {

    let installationSettingsUrl;
    if (this.user.type === "Organization") {
      installationSettingsUrl = `https://${this.app.githubHostname}/organizations/${user.name}/settings/installations/${this.installationId}`;
    }
    else {
      installationSettingsUrl = `https://${this.app.githubHostname}/settings/installations/${this.installationId}`;
    }

    this.urls = {
      app: app.urls.app,
      installationSettings: installationSettingsUrl,
    };
  }

  public static async create(user: User, app: GitHubApp, installationId: number): Promise<UserInstallation> {
    const appObj = new App({
      appId: app.config.id,
      privateKey: app.config.pem,
      log: Log,
    });

    const installOctokit = await appObj.getInstallationOctokit(Number(installationId));

    return new this(user, app, installationId, installOctokit);
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
