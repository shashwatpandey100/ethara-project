import { Router } from "express";
import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";

const router = Router();

router.all("/*", toNodeHandler(auth) as any);

export default router;
