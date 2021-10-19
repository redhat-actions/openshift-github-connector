import { GitHubAppPermissions, GitHubRepoId } from "./types/gh-types";
import ImageRegistry from "./types/image-registries";
import { WorkflowConfig } from "./workflows/workflows";

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

  export interface GetNamespacedResources {
    namespace: string,
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
    project: string,
    createNamespaceSecret: boolean,
    serviceAccount: string,
    serviceAccountRole: string,
    repos: GitHubRepoId[],
  }

  export interface CreateWorkflow {
    repo: GitHubRepoId,
    fileBasename: string,
    fileExtension: string,
    workflowConfig: WorkflowConfig,
  }

  export interface CreateInstallationToken {
    namespace: string,
    secretName: string,
    overwriteExisting?: boolean,
    repositories?: string[],
    permissions?: GitHubAppPermissions,
  }
}

export default ApiRequests;
