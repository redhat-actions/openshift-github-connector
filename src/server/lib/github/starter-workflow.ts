import yaml from "yaml";

import Log from "server/logger";
import ImageRegistry from "common/types/image-registries";
import ApiRequests from "common/api-requests";
import UserInstallation from "./user-app-installation";

export async function getStarterWorkflowContents(installation: UserInstallation): Promise<string> {

  const workflowFileContentRes = await installation.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner: "actions",
    repo: "starter-workflows",
    path: "ci/openshift.yml",
    ref: "main",

    // https://docs.github.com/en/rest/reference/repos#custom-media-types-for-repository-contents
    mediaType: {
      format: "raw",
    },
  });

  // if (!isGitHubFileContentType(workflowFileContentRes.data)) {
  //   const type = Array.isArray(workflowFileContentRes.data) ? "array" : workflowFileContentRes.data.type;
  //   throw new Error(`Received non-file response, type is "${type}"`);
  // }

  // const workflowFileDecoded = Buffer.from(
  //   workflowFileContentRes.data.content,
  //   workflowFileContentRes.data.encoding as BufferEncoding
  // ).toString("utf-8");

  // since we specified mediatype=raw
  // the .data field is the file contents
  // but the typing does not reflect this.
  const workflowFileDecoded = workflowFileContentRes.data as unknown as string;

  Log.info(`Starter workflow file starts with "${workflowFileDecoded.substring(0, 16)}"`);

  return workflowFileDecoded;
}

const ENV_SECTION = "env";

enum ENV_VARS {
  REGISTRY = "REGISTRY",
  REGISTRY_USER = "REGISTRY_USER",
  REGISTRY_PASSWORD = "REGISTRY_PASSWORD",
  NAMESPACE = "OPENSHIFT_NAMESPACE",
}

const JOB_NAME = "openshift-ci-cd";

export function editWorkflow(
  reqBody: ApiRequests.CreateWorkflow,
  imageRegistry: ImageRegistry.Info,
  branches: string[],
  workflowFile: string
): string {
  // use the 'document' yaml api to preserve comments & whitespace
  // https://eemeli.org/yaml/#documents
  // however, we lose the ability to 'as' the file with a TypeScript type from the schema
  // since we can't treat the parsed contents as JSON.

  const workflowParsed = yaml.parseDocument(workflowFile);

  // https://github.com/actions/starter-workflows/blob/main/ci/openshift.yml
  // we have to edit a couple of the top-level sections based on the user-selected settings

  const env = workflowParsed.get(ENV_SECTION);
  if (env === undefined) {
    workflowParsed.set(ENV_SECTION, {});
  }

  workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY ], imageRegistry.fullPath);
  workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY_USER ], imageRegistry.username);
  // workflowParsed.deleteIn([ ENV_SECTION, ENV_VARS.REGISTRY_USER ]);

  if (imageRegistry.ghcrUseGitHubToken) {
    workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY_PASSWORD ], "${{ secrets.GITHUB_TOKEN }}");
    // else leave it as the default secrets.REGISTRY_PASSWORD
  }

  if (reqBody.namespace) {
    workflowParsed.setIn([ ENV_SECTION, ENV_VARS.NAMESPACE ], reqBody.namespace);
  }

  workflowParsed.setIn([ "on", "push", "branches" ], branches);
  // workflowParsed.setIn([ "on", "workflow_dispatch" ], undefined);

  const firstStepPath = [ "jobs", JOB_NAME, "steps", 0 ];
  workflowParsed.deleteIn(firstStepPath);
  workflowParsed.getIn(firstStepPath).spaceBefore = false;

  return workflowParsed.toString();
}
