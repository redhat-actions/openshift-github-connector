import express, { Request } from "express";
import expressCore from "express-serve-static-core";

import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import GitHubAppMemento from "../lib/gh-app/app-memento";
import KubeWrapper from "../lib/kube/kube-wrapper";
import Log from "../logger";
import { send405 } from "../util/send-error";

const router = express.Router();
export default router;

router.route(ApiEndpoints.Cluster.ServiceAccount.path)
  .get(async (
    req,
    res: express.Response<ApiResponses.ServiceAccountState>,
    next
  ) => {

    const session = await GitHubAppMemento.tryLoad(req.sessionID);

    let resBody: ApiResponses.ServiceAccountState;
    if (!session || !session.serviceAccountName) {
      resBody = {
        serviceAccountSetup: false,
      };
    }
    else {
      resBody = {
        serviceAccountSetup: true,
        serviceAccount: {
          name: session.serviceAccountName,
        },
      };
    }

    return res.json(resBody);
  })
  .post(async (
    req: Request<
      expressCore.ParamsDictionary,
      ApiResponses.ServiceAccountState,
      ApiRequests.SetServiceAccount
    >,
    res: express.Response<ApiResponses.ServiceAccountFoundResponse>,
    next
  ) => {
    const serviceAccountName = req.body.serviceAccountName;
    Log.info(`Set service account name to "${serviceAccountName}"`);

    const foundSA = await KubeWrapper.instance.verifyServiceAccount(serviceAccountName);

    await GitHubAppMemento.saveServiceAccount(req.sessionID, serviceAccountName);

    const resBody: ApiResponses.ServiceAccountFoundResponse = {
      found: foundSA,
      serviceAccountName,
      namespace: KubeWrapper.instance.ns,
    };

    return res.json(resBody);
  })
  .all(send405([ "GET", "POST" ]));
