import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initSocketServer } from "./services/socketService";
import { initQueueSubscriber, closeQueueSubscriber } from "./services/queueSubscriberService";
import { trackRouter } from "./routes/track";
import { eventsRouter } from "./routes/events";
import { analyticsRouter } from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";
import { createRateLimiter } from "./middleware/rateLimiter";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// APIs should not be cached by browsers (prevents 304 + stale dashboards)
app.set("etag", false);
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ─── Security & Logging Middleware ────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.isDev) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const trackLimiter = createRateLimiter();
const apiLimiter = createRateLimiter();

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/track", trackLimiter, trackRouter);
app.use("/api/events", apiLimiter, eventsRouter);
app.use("/api/analytics", apiLimiter, analyticsRouter);

// Health check at root
app.get("/", (_req, res) => {
  res.json({ name: "EventStream API", version: "1.0.0", status: "ok" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // Connect to MongoDB
  await connectDatabase();

  // Attach Socket.io to the HTTP server
  initSocketServer(httpServer);

  // Subscribe to worker events (for websocket broadcasts)
  await initQueueSubscriber();

  // Start listening
  httpServer.listen(env.PORT, () => {
    console.info(`\n🚀 EventStream API running on http://localhost:${env.PORT}`);
    console.info(`📡 WebSocket server ready`);
    console.info(`🌍 Accepting connections from: ${env.CORS_ORIGIN}\n`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

async function shutdown(): Promise<void> {
  await closeQueueSubscriber();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app, httpServer };
