import express from "express";
import KubeWrapper from "../lib/kube/kube-wrapper";
import { send405 } from "../util/send-error";

import ApiEndpoints from "../../common/api-endpoints";
import Log from "../logger";
import ApiResponses from "../../common/api-responses";

const router = express.Router();
export default router;

async function getKubeClusterStatus(req: express.Request, res: express.Response): Promise<void> {
  if (KubeWrapper.initErrorFriendly) {
    const resBody: ApiResponses.ClusterStateDisconnected = {
      connected: false,
      error: KubeWrapper.initErrorFriendly,
    };

    res.status(200).json(resBody);
    return;
  }
  else if (!KubeWrapper.isInitialized()) {
    throw new Error(`KubeWrapper not initialized`);
  }

  const clusterInfo = KubeWrapper.instance.getClusterConfig();

  const resBody: ApiResponses.ClusterStateConnected = {
    connected: true,
    clusterInfo,
    namespace: KubeWrapper.instance.namespace,
  };

  res.json(resBody);
}

router.route(ApiEndpoints.Cluster.Root.path)
  .get(async (req, res, next) => {
    return getKubeClusterStatus(req, res);
  })
  .put(async (req, res, next) => {
    Log.info(`Refreshing KubeWrapper status`);
    await KubeWrapper.initialize();
    return getKubeClusterStatus(req, res);
  })
  .all(send405([ "GET", "PUT" ]));
