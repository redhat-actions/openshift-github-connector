import yaml from "yaml";

import { GitHubRepoId } from "common/types/gh-types";
import { LoginWorkflowConfig, WorkflowConfig, WorkflowIDs, WORKFLOW_INFOS } from "common/workflows/workflows";
import { getFileContentsFromGitHub } from "../gh-util";
import UserInstallation from "../user-app-installation";
import { buildStarterWorkflow } from "./starter-workflow";
import { buildCRDAWorkflow } from "./crda-workflow";

export type WorkflowCreateResult = {
	createdSecrets: string[],
	workflow: string
};

export type YamlObject = Record<string, string | number | boolean>;

export const WORKFLOW_ENV_SECTION = "env";

export async function buildWorkflow(
	installation: UserInstallation,
	repo: GitHubRepoId,
	config: WorkflowConfig,
	// pushOnBranches: string[],
): Promise<WorkflowCreateResult> {

	const workflow = await getWorkflowAsYaml(installation, config.id, /* pushOnBranches */);

	if (config.id === "starter") {
		return buildStarterWorkflow(installation, repo, config, workflow);
	}
	else if (config.id === "login") {
		return buildLoginWorkflow(config, workflow);
	}
	else if (config.id === "code_scan") {
		return buildCRDAWorkflow(installation, repo, config, workflow);
	}
	else {
		const err = new Error(`Unsupported workflow ID "${(config as any).id}"`);
		(err as any).status = 400;
		throw err;
	}
}

export async function getWorkflowAsYaml(installation: UserInstallation, id: WorkflowIDs /*, pushOnBranches: string[] */): Promise<yaml.Document> {
	const workflowFile = await getFileContentsFromGitHub(installation, WORKFLOW_INFOS[id].templateFileLocation, true);
	const workflowContents = workflowFile;

	// use the 'document' yaml api to preserve comments & whitespace
  // https://eemeli.org/yaml/#documents
  // however, we lose the ability to 'as' the file with a TypeScript type from the schema
  // since we can't treat the parsed contents as JSON.

	// the toJSON API can be used for 'reading' the document, but not for 'writing' to it,
	// since comments are lost in the JSON conversion process.
	const workflow = yaml.parseDocument(workflowContents.contents);
	workflow.set("on", [ "push", "workflow_dispatch" ]);
	return workflow;
}

async function buildLoginWorkflow(
	// installation: UserInstallation,
	config: LoginWorkflowConfig,
	workflow: yaml.Document,
): Promise<WorkflowCreateResult> {

	if (config.namespace) {
		workflow.setIn([ "jobs", "openshift", "steps", 1, "namespace", ], config.namespace);
	}

	return {
		createdSecrets: [],
		workflow: workflow.toString(),
	};
}
