
import { Octokit } from "@octokit/core";
import { PaginateInterface } from "@octokit/plugin-paginate-rest";

import { GitHubAppInstallationData, GitHubAppInstallationUrls, GitHubRepo } from "common/types/gh-types";
import GitHubApp from "server/lib/github/gh-app";
import User from "server/lib/user";
import { getAppOctokit } from "server/lib/github/gh-util";

export default class UserInstallation {

  public readonly urls: GitHubAppInstallationUrls;

  private constructor(
    public readonly user: User,
    public readonly app: GitHubApp,
    public readonly installationId: number,
    public readonly octokit: Octokit & { paginate: PaginateInterface },
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
    const octokit = getAppOctokit(app.config, installationId);

    return new this(user, app, installationId, octokit);
  }

  public async getRepos(): Promise<GitHubRepo[]> {
    const repositories: GitHubRepo[] = await this.octokit.paginate("GET /installation/repositories", { per_page: 100 });
    return repositories;
  }

  /*
  public async getRepo(id: number): Promise<GitHubRepo> {

  }

  public async getRepo(info: { owner: string, repo: string }): Promise<GitHubRepo> {

  }
  */

  public async getInstallation(): Promise<GitHubAppInstallationData> {
    const installationReq = await this.app.octokit.request(
      "GET /app/installations/{installation_id}", {
      installation_id: Number(this.installationId)
    });

    return installationReq.data;
  }
}
