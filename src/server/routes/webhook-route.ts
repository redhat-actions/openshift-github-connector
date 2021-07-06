import express from "express";
import ApiEndpoints from "common/api-endpoints";
import { send405 } from "server/express-extends";
import { WebhookReqBody } from "common/types/gh-types";

const router = express.Router();
export default router;

router.route(ApiEndpoints.Webhook.path)
  .post((req: express.Request<any, any, WebhookReqBody>, res, next) => {
    // Log.info(`A WEBHOOK`, req.body);

    // validate body.hook.config.secret

    res.sendStatus(204);
  })
  .all(send405([ "POST" ]));
