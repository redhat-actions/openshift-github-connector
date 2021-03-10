import express from "express";
import { send405 } from "../util/error";
import Routes from "./routes";

const router = express.Router();
export default router;

router.route(Routes.Webhook)
    .post((req, res, next) => {
        console.log(`A WEBHOOK`, req.body);
        res.sendStatus(204);
    })
    .all(send405([ "POST" ]));
