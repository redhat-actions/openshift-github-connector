import express from "express";
import * as k8s from "@kubernetes/client-node";

import KubeWrapper from "server/lib/kube/kube-wrapper";
import ApiEndpoints from "common/api-endpoints";
import Log from "server/logger";
import ApiResponses from "common/api-responses";
import { send405 } from "server/express-extends";
import { removeUndefined } from "common/common-util";
import ApiRequests from "common/api-requests";
import User from "server/lib/user/user";

const router = express.Router();
export default router;

async function getKubeClusterStatus(req: express.Request, res: express.Response): Promise<void> {
  if (KubeWrapper.initError) {
    const resBody: ApiResponses.ClusterStateDisconnected = {
      connected: false,
      error: KubeWrapper.initError.message,
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
    serviceAccountName: KubeWrapper.instance.serviceAccountName,
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

async function getReadableNamespaces(user: User): Promise<string[]> {
  // this should really be 'getWritableNamespaces'

  const k8sClient = user.makeKubeConfig().makeApiClient(k8s.CoreV1Api);
  const namespacesRes = await k8sClient.listNamespace();
  const namespaces = removeUndefined(namespacesRes.body.items.map((ns) => ns.metadata?.name));

  return namespaces;
}

router.route(ApiEndpoints.Cluster.Namespaces.Root.path)
  .get(async (req, res: express.Response<ApiResponses.UserNamespaces>, next) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const namespaces = await getReadableNamespaces(user);

    return res.json({
      namespaces,
    });
  })
  .all(send405([ "GET" ]));

router.route(ApiEndpoints.Cluster.Namespaces.ServiceAccounts.path + "/:namespace")
  .get(async (
    req: express.Request<ApiRequests.GetNamespacedResources>,
    res: express.Response<ApiResponses.UserNamespacedServiceAccounts>,
    next
  ) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const { namespace } = req.params;
    if (!namespace) {
      return res.sendError(400, `namespace must be provided as the last path segment.`);
    }

    const namespaces = await getReadableNamespaces(user);
    if (!namespaces.includes(namespace)) {
      return res.sendError(
        404,
        `Namespace "${namespace}" was not found, `
        + `make sure the namespace exists and that you have permission to access it.`
      );
    }

    const k8sClient = user.makeKubeConfig().makeApiClient(k8s.CoreV1Api);
    const serviceAccountsRes = await k8sClient.listNamespacedServiceAccount(namespace);

    const serviceAccounts = removeUndefined(serviceAccountsRes.body.items.map((sa) => sa.metadata?.name));

    return res.json({
      namespace,
      serviceAccounts,
    });
  })
  .all(send405([ "GET" ]));
