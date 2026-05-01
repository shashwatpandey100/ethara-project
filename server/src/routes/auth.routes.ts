import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { toNodeHandler } from "better-auth/node";

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

const authHandler = toNodeHandler(auth);

// Wrap with explicit error catching so crashes produce a readable body
router.all("/*", (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(authHandler(req as any, res as any)).catch((err: unknown) => {
    console.error("[Auth Handler Error]", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Internal server error",
        },
      });
    }
  });
});

export default router;
