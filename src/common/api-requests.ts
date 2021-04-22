import { GitHubRepoId } from "./types/github-types";

namespace ApiRequests {
  export interface InitCreateApp {
    state: string,
  }

  export interface CreatingApp {
    code: string,
    state: string,
  }

  export interface SetServiceAccount {
    // serviceAccountSecret: k8s.V1Secret & { data: ServiceAccountSecretData };
    serviceAccountToken: string,
  }

  export interface PostInstall {
    // appId: string;
    // ownerId: string;
    installationId: string,
    oauthCode: string,
  }

  export type RepoIDsList = {
    /**
     * command-separated repo IDs
     */
    repos: string,
  };

  export interface CreateActionsSecrets {
    repos: GitHubRepoId[],
    createSATokens: boolean,
  }

  export interface CreateWorkflow {
    repo: GitHubRepoId,
    workflowFileName: string,
    overwriteExisting: boolean,
    // imageRegistry: ImageRegistryInfo,
  }
}

export default ApiRequests;
