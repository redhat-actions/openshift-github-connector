import express from "express";
import os from "os";

const router = express.Router();

/* GET home page. */
router.get("/", (_req, res, _next) => {
    const host = os.hostname() || "Unknown";
    return res.render("index", { title: "Express TS", host });
});

router.get("/health", (_req, res, _next) => res.json({ status: "UP" }));

export = router;
