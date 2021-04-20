import express from "express";

import { send405, sendError } from "../util/send-error";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import { GitHubRepo, RepoSecretsPublicKey } from "../../common/types/github-types";
import { getAppForSession, createSecret, getRepoSecretPublicKey } from "../lib/gh-app/gh-util";
import KubeWrapper, { ServiceAccountToken } from "../lib/kube/kube-wrapper";
import Log from "../logger";
import SecretUtil from "../lib/kube/secret-util";
import GitHubUserMemento from "../lib/memento/user-memento";
import { Severity } from "../../common/common-util";

// https://github.com/redhat-actions/common/wiki/Naming-Guidelines#secret-names
const DEFAULT_SECRET_NAMES = {
  clusterServerUrl: "OPENSHIFT_SERVER",
  token: "OPENSHIFT_TOKEN",
};

const router = express.Router();

router.route(ApiEndpoints.App.Repos.Secrets.path)
  .get(async (
    req: express.Request<any, ApiResponses.ReposWithSecrets, void, ApiRequests.RepoIDsList>,
    res: express.Response<ApiResponses.ReposWithSecrets>,
    next
  ) => {
    const app = await getAppForSession(req, res);
    if (!app) {
      return undefined;
    }

    const reposListQueryParam = req.query.repos;
    let repos: GitHubRepo[] = [];
    if (!reposListQueryParam) {
      repos = await app.getAccessibleRepos();
    }
    else {
      const repoIds = reposListQueryParam.split(",").map((s) => Number(s.trim()));

      repos = await Promise.all(repoIds.map(async (id) => {
      // https://github.com/octokit/rest.js/issues/163#issuecomment-450007728
        const repo = await app.install.octokit.request("GET /repositories/{id}", { id });
        return repo.data;
      }));
    }

    const reposWithSecrets: ApiResponses.ReposWithSecrets["repos"] = await Promise.all(
      repos.map(async (repo): Promise<ApiResponses.ReposWithSecrets["repos"][number]> => {
        const repoSecrets = await app.install.octokit.request("GET /repos/{owner}/{repo}/actions/secrets", {
          owner: repo.owner.login,
          repo: repo.name,
        });

        return {
          repo,
          secrets: repoSecrets.data.secrets,
        };
      })
    );

    return res.json({
      defaultSecretNames: getDefaultSecretNames(),
      repos: reposWithSecrets,
      urls: app.urls,
    });
  })
  .post(async (
    req: express.Request<any, any, ApiRequests.CreateActionsSecrets>,
    res: express.Response<ApiResponses.RepoSecretsCreationSummary>,
    next
  ) => {
    if (!req.session.data?.githubUserId) {
      return sendError(res, 400, `Missing user info in cookie`);
    }

    const [ app, user ] = await Promise.all([
      getAppForSession(req, res),
      GitHubUserMemento.loadUser(req.session.data.githubUserId),
    ]);
    if (!app) {
      return undefined;
    }

    const serviceAccountName = process.env.DEV_OVERRIDE_SERVICEACCOUNT
      || KubeWrapper.instance.getClusterConfig().user.name;

    const saExists = await KubeWrapper.instance.doesServiceAccountExist(serviceAccountName);

    if (!saExists) {
      return sendError(
        res, 500,
        `Current user "${serviceAccountName}" is not a service account in namespace "${KubeWrapper.instance.ns}"`
      );
    }

    Log.info(`Using service account ${serviceAccountName}`);

    const repos = req.body.repos;

    let successes: ApiResponses.RepoSecretCreationSuccess[] = [];
    let failures : ApiResponses.RepoSecretCreationFailure[] = [];

    let saTokens: (ServiceAccountToken & { repoId: number } | undefined)[] | undefined;
    if (req.body.createSATokens) {
      Log.info(
        `Creating service account tokens for service account `
        + `${serviceAccountName} for ${repos.length} repositories`
      );

      saTokens = await Promise.all(repos.map(async (repo) => {
        try {
          // TODO handle already exists
          const saTokenForRepo = await SecretUtil.createSAToken(serviceAccountName, repo, {
            createdByApp: app.config.name,
            createdByAppId: app.config.id.toString(),
            createdByUser: user?.userName ?? "Unknown",
            createdByUserId: user?.userId ?? "Unknown",
          });

          return {
            ...saTokenForRepo,
            repoId: repo.id,
          };
        }
        catch (err) {
          Log.error(`Service account token creation failed for ${repo.owner}/${repo.name}: ${err.message}`);

          failures.push({
            success: false,
            repo,
            err: err.message,
          });
          return undefined;
        }
      }));
    }

    await Promise.all(repos.map(async (repo) => {

      // Determine which service account token to use

      let saToken: ServiceAccountToken;

      if (saTokens) {
        const saTokenMaybe = saTokens.find((token) => token?.repoId === repo.id);
        if (!saTokenMaybe) {
          Log.info(`Not creating secrets for repo ${repo.owner}/${repo.name} since token creation failed.`);
          return;
        }
        saToken = saTokenMaybe;
      }
      else {
        Log.info(`Using pod's service account token`);
        const saTokenMaybe = KubeWrapper.instance.getPodSAToken();
        if (!saTokenMaybe) {
          failures.push({ success: false, repo, err: `Failed to get pod's service account token` });
          return;
        }
        saToken = saTokenMaybe;
      }

      // Get Public key used to encrypt secrets

      let repoPublicKey: RepoSecretsPublicKey;

      try {
        repoPublicKey = await getRepoSecretPublicKey(app.install.octokit, repo);
      }
      catch (err) {
        Log.error(`Failed to obtain secret public key for ${repo.owner}/${repo.name}`, err);

        // all secret creations failed
        failures.push({
          success: false,
          repo,
          err: `Failed to obtain repository public key: ${err}`,
        });

        // do not try and create the secrets, since we don't have the public key.
        return;
      }

      // If we made it this far, we now try and create the Actions secrets.

      const clusterServerUrl = KubeWrapper.instance.getClusterConfig().server;

      const secretsToCreate: { name: string, plaintextValue: string }[] = [
        { name: DEFAULT_SECRET_NAMES.clusterServerUrl, plaintextValue: clusterServerUrl },
        { name: DEFAULT_SECRET_NAMES.token, plaintextValue: saToken.token },
      ];

      Log.info(`Creating ${secretsToCreate.length} secrets into ${repo.owner}/${repo.name}`);
      Log.info(`SA token to be used is "${saToken.tokenSecretName}"`);

      // for each secret, encrypt the secret using the public key, and then PUT it to GitHub.
      await Promise.all(secretsToCreate.map(async (secretToCreate): Promise<void> => {
        try {
          await createSecret(
            app.install.octokit,
            repo, repoPublicKey,
            secretToCreate.name,
            secretToCreate.plaintextValue,
          );

          successes.push({
            success: true,
            repo,
            actionsSecretName: secretToCreate.name,
            saTokenSecretName: saToken.tokenSecretName,
          });
        }
        catch (err) {
          Log.error(`Error creating Actions secret ${repo.owner}/${repo.name} ${secretToCreate.name}`, err);

          failures.push({
            success: false,
            repo,
            err: err.message,
            actionsSecretName: secretToCreate.name,
            saTokenSecretName: saToken.tokenSecretName,
          });
        }
      }));
    }));

    successes = successes.sort((first, second) => first.repo.fullName.localeCompare(second.repo.fullName));
    failures = failures.sort((first, second) => first.repo.fullName.localeCompare(second.repo.fullName));

    let message;
    let severity: Severity;
    if (failures.length === 0) {
      message = `Successfully created Actions secrets in all ${repos.length} repositories.`;
      severity = "success";
      Log.info(message);
    }
    else if (successes.length === 0) {
      message = `Failed to create all secrets.`;
      severity = "danger";
      Log.error(message);
    }
    else {
      const successReposWithDupes = successes.map((success) => `${success.repo.owner}/${success.repo.name}`);
      const successRepos = [ ...new Set(successReposWithDupes) ];
      const failureReposWithDupes = failures.map((failure) => `${failure.repo.owner}/${failure.repo.name}`);
      const failureRepos = [ ...new Set(failureReposWithDupes) ];

      message = `Successfully created secrets in ${successRepos.length} `
        + `repositor${successRepos.length === 1 ? "y" : "ies"}, `
        + `but failed to create secrets in ${failureRepos.length} `
        + `repositor${failureRepos.length === 1 ? "y" : "ies"}.`;

      severity = "warning";
      Log.warn(message);
    }

    return res.status(200).json({
      success: failures.length === 0,
      severity,
      message,
      successes,
      failures,
    });
  })
  .all(send405([ "GET", "POST" ]));

function getDefaultSecretNames(): ApiResponses.DefaultSecrets {
  const count = Object.keys(DEFAULT_SECRET_NAMES).length;
  return {
    count,
    defaultSecrets: DEFAULT_SECRET_NAMES,
  };
}

router.route(ApiEndpoints.App.Repos.RepoSecretDefaults.path)
  .get(async (
    req,
    res: express.Response<ApiResponses.DefaultSecrets>,
    next
  ) => {
    return res.json(getDefaultSecretNames());
  })
  .all(send405([ "GET" ]));

export default router;
