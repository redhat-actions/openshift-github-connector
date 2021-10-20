import Log from "server/logger";
import yaml from "yaml";

import { DEFAULT_SECRET_NAMES } from "common/default-secret-names";
import { GitHubRepoId } from "common/types/gh-types";
import { CRDAWorkflowConfig } from "common/workflows/workflows";
import { createActionsSecret } from "../gh-util";
import UserInstallation from "../user-app-installation";
import { WorkflowCreateResult } from "./workflows-util";

const CRDA_JOB_ID = "crda-scan";
const CRDA_SCAN_STEP_INDEX = 2;

export async function buildCRDAWorkflow(
  installation: UserInstallation,
  repo: GitHubRepoId,
  config: CRDAWorkflowConfig,
  workflow: yaml.Document,
): Promise<WorkflowCreateResult> {

  const setupStep = getSetupStep(config.projectType);
  Log.info(`Setup step is ${JSON.stringify(setupStep)}`);

  // const steps = JSON.parse(workflow.getIn([ "jobs", CRDA_JOB_ID, "steps" ]));
  // Log.debug(`Steps ${JSON.stringify(steps.toString())}`);
  // steps.unshift(setupStep);

  workflow.setIn([ "jobs", CRDA_JOB_ID, "steps", 0 ], setupStep);

  // Log.debug(`Workflow is ${workflow.toString()}`);

  Log.debug(`CRDA Step: ${JSON.stringify(
    workflow.getIn(
      [ "jobs", CRDA_JOB_ID, "steps", CRDA_SCAN_STEP_INDEX ],
    )
  )}`);

  let secretName;
  if (config.auth.type === "snyk") {
    secretName = DEFAULT_SECRET_NAMES.synkToken;
    workflow.setIn(
      [ "jobs", CRDA_JOB_ID, "steps", CRDA_SCAN_STEP_INDEX, "with", "synk_token" ],
      `\${{ secrets.${DEFAULT_SECRET_NAMES.synkToken} }}`
    );
  }
  else if (config.auth.type === "crda") {
    secretName = DEFAULT_SECRET_NAMES.crdaKey;
    workflow.setIn(
      [ "jobs", CRDA_JOB_ID, "steps", CRDA_SCAN_STEP_INDEX, "with", "crda_key" ],
      `\${{ secrets.${DEFAULT_SECRET_NAMES.crdaKey} }}`
    );
  }
  else {
    throw new Error(`Unexpected auth type "${config.auth.type}" in config auth`);
  }

  await createActionsSecret(installation.octokit, repo, secretName, config.auth.token);

  if (config.scanPRs) {
    // https://github.com/redhat-actions/crda#scanning-pull-requests
    workflow.setIn([ "on", "pull_request_target" ], {
        types: [ "opened", "synchronize", "reopened", "labeled", "edited" ]
      }
    );
  }

  if (config.manifestDirectory) {
    workflow.setIn([ "jobs", CRDA_JOB_ID, "steps", CRDA_SCAN_STEP_INDEX, "with", "manifest_directory" ], config.manifestDirectory);
  }

  return {
    createdSecrets: [ secretName ],
    workflow: workflow.toString(),
  }
}

type ActionsUsesStep = { uses: string, with?: Record<string, string> };

function getSetupStep(projectType: CRDAWorkflowConfig["projectType"]): ActionsUsesStep {
  if (!projectType) {
    throw new Error(`No project type provided for CRDA workflow`);
  }

  let step: ActionsUsesStep;

  if (projectType.type === "go") {
    step = {
      uses: "actions/setup-go@v2",
    }

    if (projectType.setupVersion) {
      step.with = {
        "go-version": projectType.setupVersion
      };
    }
  }
  else if (projectType.type === "java") {
    step = {
      uses: "actions/setup-java@v2",
    };

    // java is the only one where setupVersion is mandatory
    step.with = {
      "java-version": projectType.setupVersion,
      distribution: "temurin",
    }
  }
  else if (projectType.type === "node.js") {
    step = {
      uses: "actions/setup-node@v2",
    }

    if (projectType.setupVersion) {
      step.with = {
        "node-version": projectType.setupVersion
      };
    }
  }
  else if (projectType.type === "python") {
    step = {
      uses: "actions/setup-python@v2",
    }

    if (projectType.setupVersion) {
      step.with = {
        "python-version": projectType.setupVersion
      };
    }
  }
  else {
    throw new Error(`Failed to determine 'setup' step: unrecognized project type "${projectType.type}"`);
  }

  return step;
}
