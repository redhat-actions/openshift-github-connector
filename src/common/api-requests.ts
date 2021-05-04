import { GitHubRepoId } from "./types/gh-types";
import ImageRegistry from "./types/image-registries";

namespace ApiRequests {
  export interface CreateCallbackState {
    state: string,
  }

  export interface PreInstallApp {
    appId: number,
  }

  export interface OAuthCallbackData {
    code: string,
    state: string,
  }

  export interface SetServiceAccount {
    // serviceAccountSecret: k8s.V1Secret & { data: ServiceAccountSecretData };
    serviceAccountToken: string,
  }

  export interface PostInstall {
    // appId: string,
    // ownerId: string;
    installationId: string,
    oauthCode: string,
    setupAction: string,
  }

  /**
   * command-separated repo IDs
   */
  // export type RepoIDsList = {
  //   repos: string,
  // };

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface AddImageRegistry extends ImageRegistry.Inputs {
    ghcrUseGitHubToken?: boolean,
  }

  export interface DeleteImageRegistry {
    id: string,
  }

  export interface CreateActionsSecrets {
    repos: GitHubRepoId[],
    createSATokens: boolean,
  }

  export interface CreateWorkflow {
    repo: GitHubRepoId,
    namespace?: string,
    overwriteExisting: boolean,
    workflowFileName: string,
    imageRegistryId: string,
  }
}

export default ApiRequests;
