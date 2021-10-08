import express from "express";
import _ from "lodash";

import ApiEndpoints from "common/api-endpoints";
import ApiResponses from "common/api-responses";
import { send405 } from "server/express-extends";
import SecretUtil from "server/lib/kube/secret-util";
import GitHubAppSerializer from "server/lib/github/gh-app-serializer";
import ApiRequests from "common/api-requests";
import Log from "server/logger";
import { toValidK8sName } from "common/common-util";

const router = express.Router();

// const PARAM_APPID = "appId";

router.route(ApiEndpoints.User.GitHubInstallation.path)
  .get(async (req, res: express.Response<ApiResponses.UserAppState>, next) => {
    const user = await req.getUserOr401();
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
      const ownedApps = await Promise.all(
        user.ownsAppIds.map((appId) => GitHubAppSerializer.load(appId))
      ) as Array<GitHubApp>;
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

    if (user.ownsAppIds.length > 0) {
      // todo they could own more than one
      const ownedAppId = user.ownsAppIds[0];

      // owned
      const ownedApp = await GitHubAppSerializer.load(ownedAppId);
      if (!ownedApp) {
        throw new Error(`User ${user.name} owns app "${ownedAppId}" but that app was not found`);
      }

      const appData = _.pick(ownedApp.config, [ "id", "html_url", "name", "slug" ]);

      const ownedAppData: ApiResponses.UserOwnedAppData = {
        appConfig: ownedApp.getWithoutSecrets,
        installations: await ownedApp.getInstallations(),
        ownerUrls: ownedApp.urls,
      };

      if (installedAppData != null) {
        // owned AND installed

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

      // owned but not installed
      const ownedAppResponse: ApiResponses.UserAppOwned = {
        success: true,
        installed: false,
        owned: true,

        appData,
        ownedAppData,
      };

      return res.json(ownedAppResponse);
    }

    // not owned

    if (!installedAppResponse) {
      // neither owned nor installed
      return res.sendError(400, `User "${user.name}" does not own an app, or have an app installed.`);
    }

    // not owned, but installed
    return res.json(installedAppResponse);
  })
  .delete(async (
    req, res: express.Response<ApiResponses.RemovalResult>, next
  ) => {
    const user = await req.getUserOr401();
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
    async (req: express.Request<any, any, ApiRequests.CreateInstallationToken>, res, next) => {

      const user = await req.getUserOr401();
      if (!user) {
        return undefined;
      }

      const installation = user.installation;
      if (!installation) {
        return res.sendError(400, `No app installation for user ${user.name}`);
      }

      const {
        namespace,
        overwriteExisting,
        repositories,
      } = req.body;

      let { secretName, permissions } = req.body;

      if (!namespace) {
        return res.sendError(400, `Missing req body parameter "namespace"`);
      }

      if (!secretName) {
        secretName = `${installation.app.config.name}-token`;
      }
      secretName = toValidK8sName(secretName);

      if (permissions == null || Object.keys(permissions).length === 0) {
        permissions = {
          contents: "read",
          pull_requests: "write",
        };
      }
      Log.info(`Giving installation token permissions ${JSON.stringify(permissions)}`);

      const k8sClient = user.makeCoreV1Client();

      const secretExists = (await SecretUtil.loadFromSecret(k8sClient, namespace, secretName)) != null;

      if (secretExists) {
        if (overwriteExisting) {
          await SecretUtil.deleteSecret(k8sClient, namespace, secretName);
        }
        else {
          return res.sendError(409, `Secret ${namespace}/${secretName} already exists`);
        }
      }

      // https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app

      const tokenRes = await installation.octokit.request("POST /app/installations/{installation_id}/access_tokens", {
        installation_id: installation.installationId,
        repositories,
        permissions,
      });

      const installationToken = tokenRes.data;

      const tokenSecretBody = {
        token: installationToken.token,
        expires_at: installationToken.expires_at,
        repositories: JSON.stringify(installationToken.repositories),
        permissions: JSON.stringify(installationToken.permissions),
      };

      await SecretUtil.createSecret(
        k8sClient, namespace, secretName,
        tokenSecretBody, user.name, SecretUtil.Subtype.INSTALL_TOKEN, {
          annotations: {
            [SecretUtil.CONNECTOR_LABEL_NAMESPACE + `/expires-at`]: toValidK8sName(installationToken.expires_at),
          },
        },
      );

      return res.status(201).json({
        success: true,
        message: `Created installation token into ${namespace}/secret/${secretName}`,
        namespace,
        secretName,
        expiresAt: installationToken.expires_at,
        repositories: installationToken.repositories,
        permissions: installationToken.permissions,
      });
    }
  ).all(send405([ "POST" ]));

export default router;
