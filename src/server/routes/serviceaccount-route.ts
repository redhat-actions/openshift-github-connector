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
    res: express.Response<ApiResponses.ServiceAccountExists>,
    next
  ) => {
    const serviceAccountName = req.body.serviceAccountName;
    Log.info(`Set service account name to "${serviceAccountName}"`);

    const ns = KubeWrapper.instance.ns;

    const exists = await KubeWrapper.instance.doesServiceAccountExist(serviceAccountName);
    if (!exists) {
      const errBody = {
        serviceAccountName,
        success: false,
        title: `Service Account does not exist`,
        message: `Service Account "${serviceAccountName}" does not exist in namespace "${ns}". `
          + `Create the Service Account and try again.`,
      };
      return res.json(errBody);
    }

    await GitHubAppMemento.saveServiceAccount(req.sessionID, serviceAccountName);

    const resBody: ApiResponses.ServiceAccountExists = {
      success: true,
      serviceAccountName,
      message: `Successfully created Service Account ${serviceAccountName} in ${ns}`,
    };

    return res.json(resBody);
  })
  .all(send405([ "GET", "POST" ]));
