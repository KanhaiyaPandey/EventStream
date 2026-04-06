import type Redis from "ioredis";
import { createRedisClient } from "../queue/redis";
import { QUEUE_CHANNELS } from "../queue/channels";
import { broadcastNewEvent, broadcastAnalytics } from "./socketService";
import { eventService } from "./eventService";

type IngestedMessage = {
  event: unknown;
  jobId?: string | number | null;
  ingestedAt?: string;
};

let subscriber: Redis | null = null;

export async function initQueueSubscriber(): Promise<void> {
  if (subscriber) return;
  subscriber = createRedisClient();

  subscriber.on("error", (err) => {
    console.error("[Redis] Subscriber error:", err);
  });

  await subscriber.subscribe(QUEUE_CHANNELS.EVENT_INGESTED);
  console.info(`[Redis] Subscribed: ${QUEUE_CHANNELS.EVENT_INGESTED}`);

  subscriber.on("message", (channel, message) => {
    if (channel !== QUEUE_CHANNELS.EVENT_INGESTED) return;

    try {
      const parsed = JSON.parse(message) as IngestedMessage;
      if (!parsed?.event) return;

      console.info("[Redis] Event ingested message received");
      broadcastNewEvent(parsed.event as never);

      eventService
        .getSummary()
        .then(broadcastAnalytics)
        .catch(() => {});
    } catch {
      // ignore malformed messages
    }
  });
}

export async function closeQueueSubscriber(): Promise<void> {
  if (!subscriber) return;
  await subscriber.quit();
  subscriber = null;
}
