import { Queue } from "bullmq";
import { createRedisClient } from "./redis";

export const EVENT_QUEUE_NAME = "eventQueue";

export type EventIngestJob = {
  payload: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    properties?: Record<string, unknown>;
    timestamp?: string;
  };
  requestMeta: {
    ip: string;
    userAgent: string;
  };
};

let queue: Queue<EventIngestJob> | null = null;

export function getEventQueue(): Queue<EventIngestJob> {
  if (!queue) {
    queue = new Queue<EventIngestJob>(EVENT_QUEUE_NAME, {
      connection: createRedisClient(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 5000,
      },
    });
  }
  return queue;
}

