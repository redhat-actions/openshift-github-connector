import express from "express";
import KubeWrapper from "../../lib/kube/kube-wrapper";
import { send405 } from "../util/send-error";

import Paths from "./paths";

const router = express.Router();
export default router;

router.route(Paths.Cluster.Root)
    .get(async (req, res, next) => {
        if (!KubeWrapper.isInitialized()) {
            await KubeWrapper.initialize();
        }

        const clusterInfo = KubeWrapper.instance.getClusterInfo();
        const namespace = KubeWrapper.instance.getCurrentNamespace();
        const podsRes = await KubeWrapper.instance.getPods();

        let pods: (string | undefined)[] = [];
        if (podsRes) {
            pods = podsRes.items.map((pod) => pod.metadata?.name);
        }

        return res.render("cluster", { pods, clusterInfo, namespace });
    })
    .all(send405([ "GET" ]));
