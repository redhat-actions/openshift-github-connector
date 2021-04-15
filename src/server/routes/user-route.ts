import express from "express";

import ApiEndpoints from "../../common/api-endpoints";
import { sendSuccessStatusJSON } from "../util/server-util";
import { send405 } from "../util/send-error";

const router = express.Router();

router.route(ApiEndpoints.User.Root.path)
  .get(async (req, res, next) => {
    // stub
    return sendSuccessStatusJSON(res, 204);
  })
  .all(send405([ "GET" ]));
