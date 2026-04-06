import type Redis from "ioredis";
import type { SystemMetrics } from "@eventstream/config/types";
import { createRedisClient } from "../queue/redis";
import { getEventQueueSize } from "../queue/eventQueue";
import { env } from "../config/env";

const KEY = {
  processed: "eventstream:metrics:processed",
  failed: "eventstream:metrics:failed",
  totalTimeMs: "eventstream:metrics:totalTimeMs",
} as const;

const WORKER_HEARTBEAT_PREFIX = "eventstream:workers:heartbeat:";

let redis: Redis | null = null;

export function getMetricsRedis(): Redis {
  if (!redis) {
    redis = createRedisClient();
    redis.on("error", (err) => console.error("[Redis][Metrics] Error:", err));
  }
  return redis;
}

export async function recordJobSuccess(durationMs: number): Promise<void> {
  const r = getMetricsRedis();
  const ms = Math.max(0, Math.round(durationMs));
  await r
    .multi()
    .incr(KEY.processed)
    .incrby(KEY.totalTimeMs, ms)
    .exec();
}

export async function recordJobFailure(durationMs: number): Promise<void> {
  const r = getMetricsRedis();
  const ms = Math.max(0, Math.round(durationMs));
  await r
    .multi()
    .incr(KEY.failed)
    .incrby(KEY.totalTimeMs, ms)
    .exec();
}

export async function heartbeatWorker(workerId: string, ttlSeconds = 15): Promise<void> {
  const r = getMetricsRedis();
  const ttl = Math.max(5, Math.floor(ttlSeconds));
  await r.set(`${WORKER_HEARTBEAT_PREFIX}${workerId}`, "1", "EX", ttl);
}

export async function getActiveWorkersCount(): Promise<number> {
  const r = getMetricsRedis();
  let cursor = "0";
  let count = 0;
  do {
    const res = await r.scan(cursor, "MATCH", `${WORKER_HEARTBEAT_PREFIX}*`, "COUNT", "200");
    cursor = res[0];
    count += res[1].length;
  } while (cursor !== "0");
  return count;
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const r = getMetricsRedis();
  const [processedRaw, failedRaw, totalTimeRaw, queueSize, activeWorkers] = await Promise.all([
    r.get(KEY.processed),
    r.get(KEY.failed),
    r.get(KEY.totalTimeMs),
    getEventQueueSize(),
    getActiveWorkersCount(),
  ]);

  const totalProcessedJobs = Number(processedRaw ?? 0);
  const totalFailedJobs = Number(failedRaw ?? 0);
  const totalTimeMs = Number(totalTimeRaw ?? 0);
  const totalJobs = totalProcessedJobs + totalFailedJobs;
  const avgProcessingTimeMs = totalJobs > 0 ? Math.round(totalTimeMs / totalJobs) : 0;

  return {
    totalProcessedJobs,
    totalFailedJobs,
    queueSize,
    queueMaxSize: env.QUEUE_MAX_SIZE,
    avgProcessingTimeMs,
    activeWorkers,
    updatedAt: new Date().toISOString(),
  };
}
