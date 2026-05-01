// Vercel serverless entry point — just export the Express app.
// Do NOT call app.listen() here; Vercel handles the HTTP lifecycle.
import app from "../src/app.js";

export default app;
