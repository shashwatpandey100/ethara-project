import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestLogger } from "./middleware/logger.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import { authLimiter } from "./middleware/rateLimiter.js";

const app: Application = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(generalLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = env.CLIENT_URL.split(",").map((v) => v.trim());
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Better Auth MUST be mounted with app.all (not app.use) so Express does NOT
// strip the /api/auth prefix from req.url — Better Auth needs the full path.
app.all("/api/auth", authLimiter, (req, res, next) => {
  toNodeHandler(auth)(req as any, res as any).catch(next);
});
app.all("/api/auth/*", authLimiter, (req, res, next) => {
  toNodeHandler(auth)(req as any, res as any).catch(next);
});

// Temporary DB connectivity diagnostic — remove after confirming DB works
app.get("/api/db-test", async (req, res) => {
  try {
    const { db } = await import("./db/index.js");
    const result = await (db as any).execute("SELECT 1 as ok");
    res.json({ connected: true, result });
  } catch (err: unknown) {
    res.status(500).json({ connected: false, error: String(err) });
  }
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
