import { Worker } from "bullmq";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { EVENT_QUEUE_NAME, type EventIngestJob } from "../queue/eventQueue";
import { createRedisClient } from "../queue/redis";
import { QUEUE_CHANNELS } from "../queue/channels";
import { eventService } from "../services/eventService";
import { AlertService } from "../services/alertService";
import { AnomalyDetectionService } from "../services/anomalyDetectionService";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const redis = createRedisClient();
  const publisher = createRedisClient();

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
      console.info(`[Worker] Processing job: ${job.id ?? "unknown"}`);
      const event = await eventService.track(job.data.payload as never, job.data.requestMeta);

      const anomaly = await anomalyService.recordAndDetect({ eventType: event.eventType });
      if (anomaly) {
        await alertService.trigger({
          key: anomaly.key,
          level: "warn",
          title: "Event volume anomaly detected",
          message: `Spike detected for eventType="${anomaly.eventType}" current=${anomaly.current} avg=${anomaly.average.toFixed(
            2,
          )}x`,
          metadata: anomaly,
        });
      }

      await publisher.publish(
        QUEUE_CHANNELS.EVENT_INGESTED,
        JSON.stringify({ event, jobId: job.id, ingestedAt: new Date().toISOString() }),
      );

      return { eventId: event._id };
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
