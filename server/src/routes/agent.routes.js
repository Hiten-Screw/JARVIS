import { Router } from "express";
import { queryClinicalAgent } from "../controllers/agent.controller.js";

const router = Router();

// POST /api/v1/agent/query
router.route("/query").post(queryClinicalAgent);

export default router;
