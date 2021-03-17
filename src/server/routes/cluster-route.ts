import express from "express";
import KubeWrapper from "../lib/kube/kube-wrapper";
import { send405 } from "../util/send-error";

import Paths from "../../common/paths";
import Log from "../logger";

const router = express.Router();
export default router;

async function getKubeClusterStatus(req: express.Request, res: express.Response): Promise<void> {
    if (KubeWrapper.initError) {
        res.status(400).json({ error: KubeWrapper.initError });
        return;
    }
    else if (!KubeWrapper.isInitialized()) {
        throw new Error(`KubeWrapper not initialized`);
    }

    const clusterInfo = KubeWrapper.instance.getClusterInfo();
    const namespace = KubeWrapper.instance.getCurrentNamespace();
    const podsRes = await KubeWrapper.instance.getPods();

    let pods: (string | undefined)[] = [];
    if (podsRes) {
        pods = podsRes.items.map((pod) => pod.metadata?.name);
    }

    const resBody = {
        pods, clusterInfo, namespace,
    };

    res.json(resBody);
}

router.route(Paths.Cluster.Root)
    .get(async (req, res, next) => {
        return getKubeClusterStatus(req, res);
    })
    .put(async (req, res, next) => {
        Log.info(`Refreshing KubeWrapper status`);
        await KubeWrapper.initialize();
        return getKubeClusterStatus(req, res);
    })
    .all(send405([ "GET", "PUT" ]));
