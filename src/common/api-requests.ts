import { GitHubRepoId } from "./types/gh-types";
import ImageRegistry from "./types/image-registries";

namespace ApiRequests {
  export interface CreateCallbackState {
    state: string,
  }

  export interface PreInstallApp {
    appId: number,
  }

  export interface GitHubOAuthCallbackData {
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
    workflowFile: {
      name: string,
      extension: string,
    },
    imageRegistryId: string,
    port: number,
  }
}

export default ApiRequests;
