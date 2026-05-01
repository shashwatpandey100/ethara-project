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

app.use("/api/auth", authLimiter, (req, res, next) => {
  toNodeHandler(auth)(req as any, res as any).catch(next);
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
