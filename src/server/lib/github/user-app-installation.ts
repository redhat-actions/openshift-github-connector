
import { Octokit } from "@octokit/core";
import { PaginateInterface } from "@octokit/plugin-paginate-rest";

import { GitHubAppInstallationData, GitHubAppInstallationUrls, GitHubRepo } from "common/types/gh-types";
import { ConnectorGitHubAppInstallInfo } from "common/types/user-types";
import GitHubApp from "server/lib/github/gh-app";
import { getAppOctokit } from "server/lib/github/gh-util";
import { UserWithGitHubInfo } from "../user/user";

export default class UserInstallation {

  public readonly urls: GitHubAppInstallationUrls;

  private constructor(
    public readonly user: UserWithGitHubInfo,
    public readonly app: GitHubApp,
    public readonly installationData: GitHubAppInstallationData,
    public readonly installationId: number,
    public readonly octokit: Octokit & { paginate: PaginateInterface },
  ) {

    let installationSettingsUrl;
    if (this.user.githubUserInfo.type === "Organization") {
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

  public static async create(user: UserWithGitHubInfo, app: GitHubApp, installationId: number): Promise<UserInstallation> {
    const octokit = getAppOctokit(app.config, installationId);

    const installationReq = await octokit.request(
      "GET /app/installations/{installation_id}", {
      installation_id: Number(installationId)
    });

    return new this(user, app, installationReq.data, installationId, octokit);
  }

  public async getRepos(): Promise<GitHubRepo[]> {
    const repositories: GitHubRepo[] = await this.octokit.paginate("GET /installation/repositories", { per_page: 100 }) as GitHubRepo[];
    return repositories;
  }

  /*
  public async getRepo(id: number): Promise<GitHubRepo> {

  }

  public async getRepo(info: { owner: string, repo: string }): Promise<GitHubRepo> {

  }
  */

  public get info(): ConnectorGitHubAppInstallInfo {
    return {
      app: this.app.getWithoutSecrets,
      installation: this.installationData,
      installationId: this.installationId,
    }
  }
}
