import express, { Request } from "express";
import expressCore from "express-serve-static-core";

import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import Log from "../logger";
import { send405 } from "../util/send-error";

const router = express.Router();
export default router;

let serviceAccountName: string | undefined;

async function getServiceAccountState(): Promise<ApiResponses.ServiceAccountState> {
  if (serviceAccountName) {
    return {
      serviceAccountSetup: true,
      serviceAccount: {
        name: serviceAccountName,
      },
    };
  }

  return {
    serviceAccountSetup: false,
  };
}

router.route(ApiEndpoints.Cluster.ServiceAccount.path)
  .get(async (
    req,
    res: express.Response<ApiResponses.ServiceAccountState>,
    next
  ) => {

    const resBody = await getServiceAccountState();
    return res.json(resBody);
  })
  .post(async (
    req: Request<
      expressCore.ParamsDictionary,
      ApiResponses.ServiceAccountState,
      ApiRequests.SetServiceAccount
    >,
    res: express.Response<ApiResponses.ServiceAccountState>,
    next
  ) => {
    serviceAccountName = req.body.serviceAccountName;
    Log.info(`Set service account name to "${serviceAccountName}"`);

    const resBody: ApiResponses.ServiceAccountState = await getServiceAccountState();
    return res.json(resBody);
  })
  .all(send405([ "GET", "POST" ]));
