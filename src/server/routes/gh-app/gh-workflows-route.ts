import express from "express";
import path from "path";
import yaml from "yaml";

import ApiEndpoints from "common/api-endpoints";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import { getFriendlyHTTPError, tob64 } from "server/util/server-util";
import { sendError } from "server/util/send-error";
import KubeWrapper from "server/lib/kube/kube-wrapper";
import { GitHubContentFile } from "common/types/gh-types";
import User from "server/lib/user";

const router = express.Router();
export default router;

const WORKFLOWS_DIR = `.github/workflows/`;

router.route(ApiEndpoints.App.Workflows.path)
  .post(async (
    req: express.Request<any, void, ApiRequests.CreateWorkflow>,
    res: express.Response<ApiResponses.WorkflowCreationResult>,
    next,
  ) => {

    // we have to do the following
    // ? clone the user repo
    // - download the workflow file
    // - create .github/workflows if necessary
    // - copy the workflow file into the repo
    // ? commit the changes
    // ? push somewhere - fork somehow? permissions to push to user repo?
    // ? put up a PR
    // ? return URL to that PR or to the now-added file

    // single file permission?
    // workflow permission?
    // workflow permission scope exists in edit app page but not in documentation
    // https://docs.github.com/en/rest/reference/permissions-required-for-github-apps#permission-on-single-file

    const appInstallation = await User.getInstallationForSession(req, res);
    if (!appInstallation) {
      return undefined;
    }

    Log.info(`Create workflow file into "${req.body.repo.full_name}"`);

    const workflowFilePath = path.join(WORKFLOWS_DIR, req.body.workflowFileName + ".yml");
    Log.info(`Workflow file path is ${workflowFilePath}`);

    const repoMeta = await appInstallation.octokit.request("GET /repos/{owner}/{repo}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
    });

    const defaultBranch = repoMeta.data.default_branch;
    Log.info(`Default branch is ${defaultBranch}`);

    let existingWorkflowSha: string | undefined;
    try {
      // https://docs.github.com/en/rest/reference/repos#get-repository-content

      const existingFileRes = await appInstallation.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: req.body.repo.owner,
        repo: req.body.repo.name,
        path: workflowFilePath,
        ref: defaultBranch,
        mediaType: {
          format: "json",
        },
      });

      existingWorkflowSha = (existingFileRes.data as GitHubContentFile).sha;

      Log.info(`${workflowFilePath} already exists`);

      if (!req.body.overwriteExisting) {
        return sendError(
          res, 409,
          `"${workflowFilePath}" already exists in repository ${req.body.repo.full_name}`, "warning"
        );
      }
      // TOOD
    }
    catch (err) {
      if (err.status !== 404) {
        throw getFriendlyHTTPError(err);
      }

      // the file does not exist
    }

    const workflowFileContentRes = await appInstallation.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
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

    const namespace = KubeWrapper.instance.namespace;
    req.body.namespace = namespace;

    const workflowEdited = editWorkflow(req.body, [ defaultBranch ], workflowFileDecoded);
    // const workflowEdited = workflowFileDecoded.replace("$default-branch", defaultBranch);

    // https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
    const writeRes = await appInstallation.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
      path: workflowFilePath,
      // branch defaults to repo's default branch
      message: "Add OpenShift Starter Workflow",
      content: tob64(workflowEdited),
      sha: existingWorkflowSha,
      branch: defaultBranch,
      committer: {
        name: appInstallation.app.config.name,
        email: `no-email-here@github.com`,
      },
    });

    // const newWorkflowFileName = writeRes.data.content.name;
    const newWorkflowFileUrl = writeRes.data.content.html_url;

    const resBody: ApiResponses.WorkflowCreationResult = {
      message: `Successfully added starter workflow to ${req.body.repo.full_name}.`,
      success: true,
      severity: "success",
      url: newWorkflowFileUrl,
    };

    return res.json(resBody);
  });

const ENV_SECTION = "env";

enum ENV_VARS {
  REGISTRY = "REGISTRY",
  REGISTRY_USER = "REGISTRY_USER",
  REGISTRY_PASSWORD = "REGISTRY_PASSWORD",
  NAMESPACE = "OPENSHIFT_NAMESPACE",
}

const JOB_NAME = "openshift-ci-cd";

function editWorkflow(reqBody: ApiRequests.CreateWorkflow, branches: string[], workflowFile: string): string {
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

  // edit registry, app port, namespace here

  // if (reqBody.imageRegistry.type === "GHCR") {
  //   /* eslint-disable no-template-curly-in-string */
  //   workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY ], "ghcr.io/${{ github.actor }}");
  //   workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY_USER ], "${{ github.actor }}");
  //   // workflowParsed.deleteIn([ ENV_SECTION, ENV_VARS.REGISTRY_USER ]);
  //   workflowParsed.setIn([ ENV_SECTION, ENV_VARS.REGISTRY_PASSWORD ], "${{ github.token }}");
  //   /* eslint-enable no-template-curly-in-string */
  // }
  // else {
  //   throw new Error("Sorry, you can't use that image registry yet :(");
  // }

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
