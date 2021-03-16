import express from "express";
import { send405 } from "../util/send-error";
import Log from "../../lib/logger";
import Paths from "./paths";

const router = express.Router();
export default router;

router.route(Paths.Webhook)
    .post((req, res, next) => {
        Log.info(`A WEBHOOK`, req.body);
        res.sendStatus(204);
    })
    .all(send405([ "POST" ]));
