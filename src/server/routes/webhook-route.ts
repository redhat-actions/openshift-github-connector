import express from "express";
import { send405 } from "server/util/send-error";
import ApiEndpoints from "common/api-endpoints";

const router = express.Router();
export default router;

router.route(ApiEndpoints.Webhook.path)
  .post((req, res, next) => {
    // Log.info(`A WEBHOOK`, req.body);
    res.sendStatus(204);
  })
  .all(send405([ "POST" ]));
