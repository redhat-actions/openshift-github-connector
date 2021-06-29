/*
import express from "express";

import ApiEndpoints from "common/api-endpoints";
import ApiRequests from "common/api-requests";
import ApiResponses from "common/api-responses";
import KubeWrapper, { ServiceAccountToken as ServiceAccountTokenData } from "server/lib/kube/kube-wrapper";
import GitHubUserMemento from "server/lib/memento/user-memento";

const router = express.Router();
export default router;

router.route(ApiEndpoints.User.ServiceAccount.path)
  .get(async (
    req,
    res: express.Response<ApiResponses.ServiceAccountState>,
    next
  ) => {

    const UserSessionData = req.session.data;
    if (!UserSessionData) {
      return res.sendError(400, `No session`);
    }

    const userData = await GitHubUserMemento.loadUser(UserSessionData.githubUserId);
    if (!userData) {
      return res.sendError(400, `No data for user ID ${UserSessionData.githubUserId}`);
    }

    const serviceAccountName = userData.serviceAccount?.serviceAccountName;
    if (serviceAccountName) {
      return res.json({
        message: `Service account is "${serviceAccountName}"`,
        serviceAccountName,
        success: true,
      });
    }

    return res.json({
      success: false,
      message: `No service account set up for user.`,
    });
  })
  .post(async (
    req: express.Request<any, any, ApiRequests.SetServiceAccount>,
    res: express.Response<ApiResponses.ServiceAccountState>,
    next
  ) => {
    const UserSessionData = req.session.data;
    if (!UserSessionData) {
      return res.sendError(400, `No session`);
    }

    const serviceAccountTokenInput = req.body.serviceAccountToken;

    let serviceAccountToken: ServiceAccountTokenData;
    try {
      serviceAccountToken = await KubeWrapper.loadForServiceAccount(serviceAccountTokenInput);
    }
    catch (err) {
      return res.sendError(400, err.message, `Error adding service account token`);
    }

    await GitHubUserMemento.addServiceAccount(UserSessionData.githubUserId, {
      serviceAccountName: serviceAccountToken.serviceAccountName,
      serviceAccountToken: serviceAccountToken.token,
    });

    const resBody: ApiResponses.ServiceAccountState = {
      success: true,
      serviceAccountName: serviceAccountToken.serviceAccountName,
      message: `Successfully authenticated as Service Account `
        + `"${serviceAccountToken.serviceAccountName} in ${serviceAccountToken.namespace}"`,
    };

    return res.json(resBody);
  })
  .all(send405([ "GET", "POST" ]));

*/

export {};
