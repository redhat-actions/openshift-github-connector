import express from "express";
import ApiEndpoints from "common/api-endpoints";
import { send405 } from "server/express-extensions";

const router = express.Router();
export default router;

router.route(ApiEndpoints.Webhook.path)
  .post((req, res, next) => {
    // Log.info(`A WEBHOOK`, req.body);
    res.sendStatus(204);
  })
  .all(send405([ "POST" ]));
