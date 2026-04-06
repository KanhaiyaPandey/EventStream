import { Worker } from "bullmq";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { EVENT_QUEUE_NAME, type EventIngestJob } from "../queue/eventQueue";
import { createRedisClient } from "../queue/redis";
import { QUEUE_CHANNELS } from "../queue/channels";
import { eventService } from "../services/eventService";
import { AlertService } from "../services/alertService";
import { AnomalyDetectionService } from "../services/anomalyDetectionService";
import { recordJobFailure, recordJobSuccess, heartbeatWorker } from "../services/metricsService";
import { Event } from "../models/Event";
import { Alert } from "../models/Alert";
import { randomUUID } from "node:crypto";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const redis = createRedisClient();
  const publisher = createRedisClient();
  const workerId = randomUUID();

  redis.on("error", (err) => console.error("[Worker][Redis] Error:", err));
  publisher.on("error", (err) => console.error("[Worker][Redis] Publish error:", err));

  const alertService = new AlertService({
    redis,
    cooldownSeconds: env.ALERT_COOLDOWN_SECONDS,
  });

  const anomalyService = new AnomalyDetectionService({
    redis,
    windowBuckets: 10,
    multiplier: 2,
    minCurrent: 20,
  });

  const worker = new Worker<EventIngestJob>(
    EVENT_QUEUE_NAME,
    async (job) => {
      const start = Date.now();
      try {
        const eventId = job.data.payload.eventId;
        if (!eventId) {
          const durationMs = Date.now() - start;
          await recordJobFailure(durationMs);
          await publisher.publish(QUEUE_CHANNELS.METRICS_TICK, JSON.stringify({ at: Date.now() }));
          return { skipped: true, reason: "missing_eventId" };
        }

        const exists = await Event.findOne({ eventId }).select({ _id: 1 }).lean();
        if (exists) {
          const durationMs = Date.now() - start;
          await recordJobSuccess(durationMs);
          await publisher.publish(QUEUE_CHANNELS.METRICS_TICK, JSON.stringify({ at: Date.now() }));
          return { skipped: true, reason: "duplicate_eventId", eventId };
        }

        const event = await eventService.track(job.data.payload as never, job.data.requestMeta);

        const anomaly = await anomalyService.recordAndDetect({ eventType: event.eventType });
        if (anomaly) {
          const triggered = await alertService.trigger({
            key: `anomaly:${anomaly.eventType}`,
            level: "warn",
            title: "Event volume anomaly detected",
            message: `Spike detected for eventType="${anomaly.eventType}" current=${anomaly.current} avg=${anomaly.average.toFixed(
              2,
            )}x`,
            metadata: anomaly,
          });

          if (triggered) {
            const alert = await Alert.create({
              type: "anomaly",
              message: `Spike detected for eventType="${anomaly.eventType}" current=${anomaly.current} avg=${anomaly.average.toFixed(
                2,
              )}x`,
              severity: "warning",
              timestamp: new Date(),
              metadata: anomaly,
            });

            await publisher.publish(
              QUEUE_CHANNELS.ALERT_CREATED,
              JSON.stringify({ alert: alert.toJSON() }),
            );
          }
        }

        await publisher.publish(
          QUEUE_CHANNELS.EVENT_INGESTED,
          JSON.stringify({ event, jobId: job.id, ingestedAt: new Date().toISOString() }),
        );

        const durationMs = Date.now() - start;
        await recordJobSuccess(durationMs);
        await publisher.publish(QUEUE_CHANNELS.METRICS_TICK, JSON.stringify({ at: Date.now() }));
        return { eventId: event._id };
      } catch (err: any) {
        const durationMs = Date.now() - start;

        const isDup =
          typeof err?.message === "string" &&
          (err.message.includes("E11000") || err.message.includes("duplicate key"));
        if (isDup) {
          await recordJobSuccess(durationMs);
          await publisher.publish(QUEUE_CHANNELS.METRICS_TICK, JSON.stringify({ at: Date.now() }));
          return { skipped: true, reason: "duplicate_eventId" };
        }

        await recordJobFailure(durationMs);
        await publisher.publish(QUEUE_CHANNELS.METRICS_TICK, JSON.stringify({ at: Date.now() }));
        throw err;
      }
    },
    {
      connection: createRedisClient(),
      concurrency: 10,
    },
  );

  worker.on("completed", (job) => {
    console.info(`[Worker] Job completed: ${job?.id ?? "unknown"}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job failed: ${job?.id ?? "unknown"}`, err);
  });

  const shutdown = async (): Promise<void> => {
    console.info("[Worker] Shutting down...");
    await Promise.allSettled([
      worker.close(),
      redis.quit(),
      publisher.quit(),
    ]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  setInterval(() => {
    heartbeatWorker(workerId).catch(() => {});
  }, 5000).unref();

  console.info("[Worker] EventStream worker started");
}

process.on("unhandledRejection", (reason) => {
  console.error("[Worker] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Worker] Uncaught exception:", err);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});
