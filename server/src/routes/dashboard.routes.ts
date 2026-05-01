import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDashboardStats, getProjectDigest } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getDashboardStats);
router.get("/projects/:projectId/digest", getProjectDigest);

export default router;
