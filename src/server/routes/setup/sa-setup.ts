import express from "express";
import Paths from "../paths";
import { send405, sendError } from "../../util/send-error";
import KubeWrapper from "../../../lib/kube/kube-wrapper";
import { getFriendlyHTTPError } from "../../util";

const router = express.Router();
export default router;

router.route(Paths.Setup.CreateSA)
    .get(async (req, res, next) => {
        if (!KubeWrapper.isInitialized()) {
            if (KubeWrapper.initError) {
                return sendError(
                    res, 500,
                    `Failed to contact your Kubernetes cluster: ${getFriendlyHTTPError(KubeWrapper.initError)}`
                );
            }
            throw new Error(`Could not initialize Kubernetes wrapper`);
        }

        return res.render("setup/create-sa", {

        });
    })
    .all(send405([ "GET" ]));
