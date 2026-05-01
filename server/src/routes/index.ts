import { Router } from "express";
import healthRoutes from "./health.routes.js";
import projectsRoutes from "./projects.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/projects", projectsRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
