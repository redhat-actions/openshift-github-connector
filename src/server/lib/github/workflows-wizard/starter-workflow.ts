import yaml from "yaml";

import { DEFAULT_SECRET_NAMES } from "common/default-secret-names";
import { GitHubRepoId } from "common/types/gh-types";
import ImageRegistry from "common/types/image-registries";
import { StarterWorkflowConfig } from "common/workflows/workflows";
import { createActionsSecret } from "../gh-util";
import UserInstallation from "../user-app-installation";
import { WorkflowCreateResult, WORKFLOW_ENV_SECTION } from "./workflows-util";
import Log from "server/logger";

enum STARTER_WF_ENV_VARS {
  REGISTRY = "IMAGE_REGISTRY",
  REGISTRY_USER = "IMAGE_REGISTRY_USER",
  REGISTRY_PASSWORD = "IMAGE_REGISTRY_PASSWORD",
  NAMESPACE = "OPENSHIFT_NAMESPACE",
  APP_PORT = "APP_PORT"
}

/**
 *
 * @returns The name of the created secret
 */
 async function createImageRegistrySecret(installation: UserInstallation, imageRegistry: ImageRegistry.Info, repo: GitHubRepoId): Promise<string> {
	const secretName = DEFAULT_SECRET_NAMES.registryPassword;

	await createActionsSecret(
		installation.octokit, repo, secretName, imageRegistry.passwordOrToken
	);

	return secretName;
}

// hard-coded for starter workflow
const STARTER_WF_JOB_NAME = "openshift-ci-cd";

export async function buildStarterWorkflow(
  installation: UserInstallation,
  repo: GitHubRepoId,
  config: StarterWorkflowConfig,
  workflow: yaml.Document,
): Promise<WorkflowCreateResult> {
  // https://github.com/actions/starter-workflows/blob/main/deployments/openshift.yml
  // we have to edit a couple of the top-level sections based on the user-selected settings

  const env: Record<string, string> = {};
  const createdSecrets: string[] = [];

  if (config.imageRegistryId) {
    const imageRegistry = installation.user.imageRegistries.getById(config.imageRegistryId);
    if (!imageRegistry) {
      const err = new Error(`Image registry with Id ${config.imageRegistryId} was not found`);
      (err as any).status = 404;
      throw err;
    }

    Log.info(`Image registry ID is ${config.imageRegistryId}`);

    env[STARTER_WF_ENV_VARS.REGISTRY] = imageRegistry.fullPath;
    env[STARTER_WF_ENV_VARS.REGISTRY_USER] = imageRegistry.username;

    if (imageRegistry.passwordOrToken && !imageRegistry.ghcrUseGitHubToken) {
      const registryPasswordSecret = await createImageRegistrySecret(
        installation,
        imageRegistry,
        repo
      );

      createdSecrets.push(registryPasswordSecret);

      env[STARTER_WF_ENV_VARS.REGISTRY_PASSWORD] = `\${{ secrets.${registryPasswordSecret} }}`;
    }
  }

  if (config.port) {
    env[STARTER_WF_ENV_VARS.APP_PORT] = config.port;
  }

  if (config.namespace) {
    env[STARTER_WF_ENV_VARS.NAMESPACE] = config.namespace;
  }

  const stepsPath = [ "jobs", STARTER_WF_JOB_NAME, "steps", ];
  if (config.containerfileLocation) {

    const steps = workflow.getIn(stepsPath).toJSON() as Record<string, any>[];

    const buildahStepIndex = steps.findIndex((step) => {
      return step.uses?.toLowerCase().includes("redhat-actions/buildah-build");
    });

    Log.info(`Buildah step index is ${buildahStepIndex}`);

    if (buildahStepIndex === -1) {
      throw new Error(`Could not find buildah-build step in starter workflow when trying to set Containerfile location`);
    }

    workflow.setIn([ ...stepsPath, buildahStepIndex, "with", "dockerfiles" ], config.containerfileLocation);
  }

  Object.entries(env).forEach(([ key, value ]) => {
    Log.debug(`Set workflow env ${key}=${value}`);
    workflow.setIn([ WORKFLOW_ENV_SECTION, key ], value);
  });

  // delete the 'check for secrets' step since we don't need it and it adds a lot of verbosity
  workflow.deleteIn([ ...stepsPath, 0 ]);


  // const firstStepPath = [ "jobs", STARTER_WF_JOB_NAME, "steps", 0 ];
  // workflow.deleteIn(firstStepPath);
  // workflow.getIn(firstStepPath).spaceBefore = false;

  return {
    createdSecrets,
    workflow: workflow.toString(),
  };
}
