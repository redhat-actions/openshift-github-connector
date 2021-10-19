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
  let namespaces: string[];
  // const k8sClient = user.makeKubeConfig().makeApiClient(k8s.CoreV1Api);
  const crsClient = user.makeKubeConfig().makeApiClient(k8s.CustomObjectsApi);
  try {
    const projectsRes = await crsClient.listClusterCustomObject("project.openshift.io", "v1", "projects");
    const projects = (projectsRes.body as any).items as { metadata: k8s.V1ObjectMeta }[];
    namespaces = removeUndefined(projects.map((proj) => proj.metadata.name));
  }
  catch (err) {
    Log.warn(`User ${user.name} encountered error listing namespaces: ${err}`);
    // eslint-disable-next-line eqeqeq
    if (err.statusCode == 403) {
      namespaces = [];
    }
    else {
      throw err;
    }
  }

  return namespaces;
}

router.route(ApiEndpoints.Cluster.Projects.Root.path)
  .get(async (req, res: express.Response<ApiResponses.UserProjects>, next) => {
    const user = await req.getUserOr401();
    if (!user) {
      return undefined;
    }

    const namespaces = await getReadableNamespaces(user);

    return res.json({
      projects: namespaces,
    });
  })
  .all(send405([ "GET" ]));

router.route(ApiEndpoints.Cluster.Projects.ServiceAccounts.path + "/:namespace")
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
