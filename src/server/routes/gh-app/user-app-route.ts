import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import GitHubApp from "server/lib/github/gh-app";
import { send405 } from "server/express-extends";
import SecretUtil from "server/lib/kube/secret-util";
import { GitHubAppPermissions } from "common/types/gh-types";

const router = express.Router();

// const PARAM_APPID = "appId";

router.route(ApiEndpoints.User.GitHubInstallation.path)
  .get(async (req, res: express.Response<ApiResponses.UserAppState>, next) => {
    const user = await req.getUserOrDie();
    if (!user) {
      return undefined;
    }

    // if (!req.params[PARAM_APPID]) {
    //   return res.sendError(400, `App ID not provided in request path`);
    // }

    // const appId = Number(req.params[PARAM_APPID]);

    // if (Number.isNaN(appId)) {
    //   return res.sendError(400, `Invalid app ID "${appId}" provided in request path`);
    // }

    // there are four states which correspond to the subtypes of ApiResponses.GitHubAppState,
    // depending on two variables -
    // 1. does the user own an app?
    // 2. does the user have an app installed?

    let installedAppResponse: ApiResponses.UserAppInstalled | undefined;
    let installedAppData: ApiResponses.UserAppInstalledData | undefined;

    if (user.installation != null) {
      installedAppData = {
        installation: user.installation.installationData,
        installUrls: user.installation.urls,
        repos: await user.installation.getRepos(),
      };

      installedAppResponse = {
        installed: true,
        owned: false,
        success: true,

        appData: {
          id: user.installation.app.id,
          html_url: user.installation.app.config.html_url,
          name: user.installation.app.config.name,
          slug: user.installation.app.config.slug,
        },
        installedAppData,
      };
    }

    /*
    if (user.ownsAppIds.length > 0) {
      // owned
      const ownedApps = await Promise.all(user.ownsAppIds.map((appId) => GitHubApp.load(appId))) as Array<GitHubApp>;
      if (ownedApps.length < user.ownsAppIds.length) {
        throw new Error(`User "${user.name} owns apps ${user.ownsAppIds.join(", ")} `
          + `but at least one app was not found. Apps found were ${ownedApps.join(", ")}`);
      }

      const appData = ownedApps.map((app) => ({
        html_url: app.config.html_url,
        name: app.config.name,
        slug: app.config.slug,
      }));
    */

    if (user.installation && user.ownsAppIds.includes(user.installation.app.id)) {
      // owned
      const ownedApp = await GitHubApp.load(user.installation.app.id);
      if (!ownedApp) {
        throw new Error(`User ${user.name} owns app ${user.installation.app.id} but that app was not found`);
      }

      const appData = {
        id: user.installation.app.id,
        html_url: ownedApp.config.html_url,
        name: ownedApp.config.name,
        slug: ownedApp.config.slug,
      };

      const ownedAppData: ApiResponses.UserOwnedAppData = {
        appConfig: ownedApp.getWithoutSecrets,
        installations: await ownedApp.getInstallations(),
        ownerUrls: ownedApp.urls,
      };

      if (installedAppData != null) {
        // owned and installed

        const combinedData: ApiResponses.UserAppOwnedAndInstalled = {
          success: true,

          // this is duplicated in this obj
          appData,
          installedAppData,
          installed: true,
          ownedAppData,
          owned: true,
        };

        return res.json(combinedData);
      }

      const ownedAppResponse: ApiResponses.UserAppOwned = {
        success: true,
        installed: false,
        owned: true,

        appData,
        ownedAppData,
      };

      // owned but not installed
      return res.json(ownedAppResponse);
    }

    // not owned

    if (!installedAppResponse) {
      // neither owned nor installed

      const resBody: ApiResponses.GitHubAppMissing = {
        message: `User "${user.name}" does not own an app, or have an app installed.`,
        success: false,
      };

      return res.json(resBody);
    }

    // not owned, but installed
    return res.json(installedAppResponse);
  })
  .delete(async (
    req, res: express.Response<ApiResponses.RemovalResult>, next
  ) => {
    const user = await req.getUserOrDie();
    if (!user) {
      return undefined;
    }

    const removed = await user.removeInstallation();
    const message = removed
      ? `Removed app installation from ${user.name}"`
      : `No installation was found for ${user.name}`;

    return res.json({
      success: true,
      message,
      removed,
    });
  })
  .all(send405([ "GET", "DELETE" ]));

router.route(ApiEndpoints.User.GitHubInstallationToken.path)
  .post(
    async (req, res, next) => {

      const user = await req.getUserOrDie();
      if (!user) {
        return undefined;
      }

      const { namespace, secretName } = req.body;
      if (!namespace) {
        return res.sendError(400, `Missing req body parameter "namespace"`);
      }
      if (!secretName) {
        return res.sendError(400, `Missing req body parameter "secretName"`);
      }

      const k8sClient = user.makeCoreV1Client();

      const secretExists = (await SecretUtil.loadFromSecret(k8sClient, namespace, secretName)) != null;

      if (secretExists) {
        return res.sendError(409, `Secret ${namespace}/${secretName} already exists`);
      }

      const installation = user.installation;
      if (!installation) {
        return res.sendError(400, `No installation for user ${user.name}`);
      }

      // https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app

      const tokenPermissions: GitHubAppPermissions = {
        // as per the feature request https://github.com/redhat-actions/openshift-github-connector/issues/17
        contents: "read",
        pull_requests: "write",
      };

      const tokenRes = await installation.octokit.request("POST /app/installations/{installation_id}/access_tokens", {
        installation_id: installation.installationId,
        tokenPermissions,
      });

      const installationToken = tokenRes.data;

      // if there is no 'repositories' field, it defaults to all repos
      // https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app
      const repositories = installationToken.repositories ?? await installation.getRepos();
      const repoNames = repositories.map((repo) => repo.full_name);

      const tokenSecretBody = {
        token: installationToken.token,
        expires_at: installationToken.expires_at,
        repositories: JSON.stringify(repoNames),
        permissions: JSON.stringify(installationToken.permissions),
      };

      await SecretUtil.createSecret(
        k8sClient, namespace, secretName,
        tokenSecretBody, user.name, SecretUtil.Subtype.INSTALL_TOKEN
      );

      return res.status(201).json({
        success: true,
        message: `Created installation token into ${namespace}/${secretName}`,
        namespace,
        secretName,
      });
    }
  ).all(send405([ "POST" ]));

export default router;
