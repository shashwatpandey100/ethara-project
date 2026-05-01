import { Router } from "express";
import { auth } from "../lib/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { toNodeHandler } from "better-auth/node";

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// Better Auth handles all /api/auth/* routes
router.all("/*", toNodeHandler(auth));

export default router;
