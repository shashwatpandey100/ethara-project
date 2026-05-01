import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        username?: string | null;
        emailVerified: boolean;
        image?: string | null;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });

    if (!session || !session.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    req.user = session.user;

    if (!session.user.emailVerified) {
      res.status(403).json({
        success: false,
        message: "Email not verified. Please verify your email before continuing.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};
