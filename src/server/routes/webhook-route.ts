import express from "express";
import { send405 } from "../util/send-error";
import Endpoints from "../../common/endpoints";

const router = express.Router();
export default router;

router.route(Endpoints.Webhook.path)
  .post((req, res, next) => {
    // Log.info(`A WEBHOOK`, req.body);
    res.sendStatus(204);
  })
  .all(send405([ "POST" ]));
