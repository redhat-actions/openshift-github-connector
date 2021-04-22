import express from "express";
import path from "path";

import ApiEndpoints from "common/api-endpoints";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import { getAppForSession } from "server/lib/gh-app/gh-util";
import { getFriendlyHTTPError, tob64 } from "server/util/server-util";
import { sendError } from "server/util/send-error";

const router = express.Router();
export default router;

const WORKFLOWS_DIR = `.github/workflows/`;

router.route(ApiEndpoints.App.Workflows.path)
// .get(async (
//   req: express.Request,
//   res: express.Response,
//   next
// ) => {
//   const app = await getAppForSession(req, res);
//   if (!app) {
//     return undefined;
//   }

  // })
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

    const app = await getAppForSession(req, res);
    if (!app) {
      return undefined;
    }

    Log.info(`Create workflow file into "${req.body.repo.full_name}"`);

    const workflowFilePath = path.join(WORKFLOWS_DIR, req.body.workflowFileName);
    Log.info(`Workflow file path is ${workflowFilePath}`);

    const repoMeta = await app.install.octokit.request("GET /repos/{owner}/{repo}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
    });

    const defaultBranch = repoMeta.data.default_branch;
    Log.info(`Default branch is ${defaultBranch}`);

    try {
      // https://docs.github.com/en/rest/reference/repos#get-repository-content

      // const existingFileRes =
      await app.install.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: req.body.repo.owner,
        repo: req.body.repo.name,
        path: workflowFilePath,
        ref: defaultBranch,
        mediaType: {
          format: "json",
        },
      });

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

    const workflowFileContentRes = await app.install.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
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

    // const workflowEdited = editWorkflow(req.body, [ defaultBranch ], workflowFileDecoded);
    const workflowEdited = workflowFileDecoded.replace("$default-branch", defaultBranch);

    // https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
    const writeRes = await app.install.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
      path: workflowFilePath,
      // branch defaults to repo's default branch
      message: "Add OpenShift Starter Workflow",
      content: tob64(workflowEdited),
      // sha
      branch: defaultBranch,
      committer: {
        name: app.config.name,
        email: "no-email-here@github.com",
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

/*
function editWorkflow(req.body: ApiRequests.CreateWorkflow, branches: string[], workflowFileContents: string): string {
  const workflowNullable = jsYaml.load(workflowFileContents);
  if (workflowNullable == null) {
    throw new Error(`Failed to parse workflow file as YAML`);
  }

  const workflow = workflowNullable as Workflow;

  // https://github.com/actions/starter-workflows/blob/main/ci/openshift.yml
  // we have to edit a couple of the top-level sections based on the user-selected settings

  if (!workflow.env) {
    workflow.env = {};
  }

  // edit registry, app port, namespace here

  workflow.on = {
    push: {
      branches,
    },
  };

  return jsYaml.dump(workflow);
}
*/
