import express from "express";
import path from "path";

import ApiEndpoints from "common/api-endpoints";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import Log from "server/logger";
import { getFriendlyHTTPError, tob64 } from "server/util/server-util";
import KubeWrapper from "server/lib/kube/kube-wrapper";
import { GitHubContentFile, getSecretsUrlForRepo } from "common/types/gh-types";
import { editWorkflow, getStarterWorkflowContents } from "server/lib/github/starter-workflow";
import { createActionsSecret } from "server/lib/github/gh-util";
import { DEFAULT_SECRET_NAMES } from "common/default-secret-names";

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

    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const installation = user.installation;
    if (!installation) {
      return res.sendError(400, `No installation for user ${user.name}`);
    }

    const imageRegistry = user.imageRegistries.getById(req.body.imageRegistryId);
    if (!imageRegistry) {
      return res.sendError(404, `Image registry with Id ${req.body.imageRegistryId} was not found`);
    }

    await createActionsSecret(
      installation.octokit, req.body.repo, DEFAULT_SECRET_NAMES.registryPassword, imageRegistry.passwordOrToken
    );

    const registrySecretName = `${req.body.repo.full_name}/${DEFAULT_SECRET_NAMES.registryPassword}`;

    Log.info(`Create workflow file into "${req.body.repo.full_name}"`);

    const workflowFilePath = path.join(WORKFLOWS_DIR, req.body.workflowFile.name + req.body.workflowFile.extension);
    Log.info(`Workflow file path is ${workflowFilePath}`);

    const repoMeta = (await installation.octokit.request("GET /repos/{owner}/{repo}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
    })).data;

    const defaultBranch = repoMeta.default_branch;
    Log.info(`Default branch is ${defaultBranch}`);

    let existingWorkflowSha: string | undefined;
    try {
      // https://docs.github.com/en/rest/reference/repos#get-repository-content

      const existingFileRes = await installation.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
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
        return res.sendError(
          409,
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

    const namespace = KubeWrapper.instance.namespace;
    req.body.namespace = namespace;

    const workflowFileContents = await getStarterWorkflowContents(installation);
    const workflowEdited = editWorkflow(req.body, imageRegistry, [ defaultBranch ], workflowFileContents);
    // const workflowEdited = workflowFileDecoded.replace("$default-branch", defaultBranch);

    // https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
    const writeRes = await installation.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: req.body.repo.owner,
      repo: req.body.repo.name,
      path: workflowFilePath,
      // branch defaults to repo's default branch
      message: "Add OpenShift Starter Workflow",
      content: tob64(workflowEdited),
      sha: existingWorkflowSha,
      branch: defaultBranch,
      committer: {
        name: installation.app.config.name,
        email: `no-email-here@github.com`,
      },
    });

    // const newWorkflowFileName = writeRes.data.content.name;

    // eslint-disable-next-line
    const newWorkflowFileUrl = writeRes.data.content?.html_url ?? repoMeta.html_url;

    const resBody: ApiResponses.WorkflowCreationResult = {
      message: `Successfully created registry password secret, `
        + `and added starter workflow to ${req.body.repo.full_name}.`,
      success: true,
      severity: "success",
      secretsUrl: getSecretsUrlForRepo(repoMeta),
      workflowFileUrl: newWorkflowFileUrl,
      registrySecret: registrySecretName,
    };

    return res.json(resBody);
  });
