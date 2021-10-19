import ApiEndpoints from "common/api-endpoints";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import { getSecretsUrlForRepo, resolveGitHubFileUrl } from "common/types/gh-types";
import { GITHUB_WORKFLOWS_DIR, WORKFLOW_INFOS } from "common/workflows/workflows";
import express from "express";
import path from "path";
import { send405 } from "server/express-extends";
import { getFileContentsFromGitHub } from "server/lib/github/gh-util";
import { buildWorkflow } from "server/lib/github/workflows-wizard/workflows-util";
import Log from "server/logger";
import { tob64 } from "server/util/server-util";

const router = express.Router();
export default router;

router.route(ApiEndpoints.App.Workflows.path)
  .post(async (
    req: express.Request<any, void, ApiRequests.CreateWorkflow>,
    res: express.Response<ApiResponses.WorkflowCreationResult>,
    next,
  ) => {
    const installation = await req.getInstallationOr400();
    if (!installation) {
      return undefined;
    }

    const { repo } = req.body;

    Log.info(`Trying to add workflow ${req.body.workflowConfig.id} to ${repo.full_name}`);

    const repoMeta = (await installation.octokit.request("GET /repos/{owner}/{repo}", {
      owner: repo.owner,
      repo: repo.name,
    })).data;

    const defaultBranch = repoMeta.default_branch;
    Log.info(`Default branch is ${defaultBranch}`);
    const defaultBranchRef = `heads/${defaultBranch}`;

    const defaultBranchHeadSha = (await installation.octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
      owner: repo.owner,
      repo: repo.name,
      ref: defaultBranchRef,
    })).data.object.sha;

    Log.info(`Default branch HEAD sha is ${defaultBranchHeadSha}`);

    const { workflowConfig } = req.body;

    const workflowFilePath = path.join(GITHUB_WORKFLOWS_DIR, req.body.fileBasename + req.body.fileExtension);
    Log.info(`Create workflow file ${workflowFilePath} into "${req.body.repo.full_name}"`);

    const { createdSecrets, workflow } = await buildWorkflow(
      installation,
      repo,
      workflowConfig,
      // [ defaultBranch ]
    );

    Log.info(`Successfully built workflow and created secrets ${JSON.stringify(createdSecrets)}`);

    const existingWorkflowFile = await getFileContentsFromGitHub(installation, {
      owner: repo.owner,
      repo: repo.name,
      path: workflowFilePath,
      ref: defaultBranchRef,
    }, false);

    const author = {
      name: `${installation.user.githubUserInfo.name} with ${installation.app.config.name}`,
      email: installation.user.githubUserInfo.email ?? "noreply@github.com",
    };

    const repoBranches = (await installation.octokit.request("GET /repos/{owner}/{repo}/branches", {
      owner: repo.owner,
      repo: repo.name,
    })).data;

    const newBranchBaseName = `add-${workflowConfig.id}-workflow`;
    let newBranchName = newBranchBaseName;
    let branchId = 0;
    while (repoBranches.map((branch) => branch.name).includes(newBranchName)) {
      branchId++;
      newBranchName = newBranchBaseName + `-${branchId}`;
    }
    Log.info(`New branch will be ${newBranchName}`);

    const branchCreateRes = (await installation.octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: repo.owner,
      repo: repo.name,
      ref: `refs/heads/${newBranchName}`,
      sha: defaultBranchHeadSha,
    })).data;

    Log.info(`Created ref ${branchCreateRes.ref}, commit is ${branchCreateRes.object.sha}`);

    // https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
    const writeFileRes = (await installation.octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: repo.owner,
      repo: repo.name,
      path: workflowFilePath,
      message: `${existingWorkflowFile == null ? "Add" : "Update"} ${workflowConfig.id} workflow`,
      content: tob64(workflow),
      sha: existingWorkflowFile?.sha,
      branch: newBranchName,
      author,
      committer: author,
    })).data;

    Log.info(`Wrote new workflow file ${writeFileRes.content?.html_url}`);

    const workflowInfo = WORKFLOW_INFOS[workflowConfig.id];

    const prTitle = `${existingWorkflowFile == null ? "Add" : "Update"} ${workflowConfig.id} workflow`;
    const prBody = `[${installation.user.githubUserInfo.name}](${installation.user.githubUserInfo.html_url}) `
      + `wants to ${existingWorkflowFile == null ? "add" : "update"} the ${workflowInfo.name} `
      + `GitHub Actions workflow ${existingWorkflowFile == null ? "to" : "in"} this repository.\n\n`
      + `This workflow is based on ${resolveGitHubFileUrl(workflowInfo.templateFileLocation)}`;

    const pullRes = (await installation.octokit.request("POST /repos/{owner}/{repo}/pulls", {
      owner: repo.owner,
      repo: repo.name,
      head: newBranchName,
      base: defaultBranch,
      title: prTitle,
      body: prBody,
      maintainer_can_modify: true,
    })).data;

    Log.info(`Created pull request ${pullRes.html_url}`);

    const resBody: ApiResponses.WorkflowCreationResult = {
      message: `Successfully opened workflow pull request`,
      success: true,
      id: workflowInfo.id,
      repo,
      createdSecrets,
      prNumber: pullRes.number,
      urls: {
        pullRequest: pullRes.html_url,
        secrets: getSecretsUrlForRepo(repoMeta),
        workflowFile: writeFileRes.content?.html_url ?? repoMeta.html_url,
      },
    };

    return res.json(resBody);
  }).all(send405([ "POST" ]));
