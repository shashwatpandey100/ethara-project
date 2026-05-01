// Vercel serverless entry point — just export the Express app.
// Do NOT call app.listen() here; Vercel handles the HTTP lifecycle.
import app from "../src/app.js";

// Catch unhandled rejections/exceptions that would otherwise silently crash
// the serverless function with an empty 500 body.
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection in serverless]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception in serverless]", err);
});

export default app;
