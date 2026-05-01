import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { toNodeHandler } from "better-auth/node";

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

const authHandler = toNodeHandler(auth);

// Async wrapper so unhandled errors propagate to Express error handler
router.all("/*", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await (authHandler as any)(req, res);
  } catch (err: unknown) {
    console.error("[Auth Handler Error]", err);
    next(err);
  }
});

export default router;
