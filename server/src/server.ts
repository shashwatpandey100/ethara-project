import app from "./app.js";
import { env } from "./config/env.js";

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection] Server kept alive:", reason);
});

process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error("[Fatal] Port already in use:", err.message);
    process.exit(1);
  }
  console.error("[Uncaught Exception] Server kept alive:", err);
});

const PORT = Number(env.PORT);

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(
        `\nTaskScribe API server started!\nEnvironment: ${env.NODE_ENV}\nPort: ${PORT}\nURL: http://localhost:${PORT}\n`
      );
    });
  } catch (err) {
    console.error("\nFailed to start server:", err, "\n");
    process.exit(1);
  }
};

startServer();
