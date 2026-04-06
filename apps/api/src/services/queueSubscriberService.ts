import type Redis from "ioredis";
import { createRedisClient } from "../queue/redis";
import { QUEUE_CHANNELS } from "../queue/channels";
import { broadcastNewEvent, broadcastAnalytics, broadcastMetrics, broadcastAlertCreated } from "./socketService";
import { eventService } from "./eventService";
import { getSystemMetrics } from "./metricsService";

type IngestedMessage = {
  event: unknown;
  jobId?: string | number | null;
  ingestedAt?: string;
};

type AlertCreatedMessage = {
  alert: unknown;
};

let subscriber: Redis | null = null;

export async function initQueueSubscriber(): Promise<void> {
  if (subscriber) return;
  subscriber = createRedisClient();

  subscriber.on("error", (err) => {
    console.error("[Redis] Subscriber error:", err);
  });

  await subscriber.subscribe(
    QUEUE_CHANNELS.EVENT_INGESTED,
    QUEUE_CHANNELS.METRICS_TICK,
    QUEUE_CHANNELS.ALERT_CREATED
  );
  console.info(
    `[Redis] Subscribed: ${QUEUE_CHANNELS.EVENT_INGESTED}, ${QUEUE_CHANNELS.METRICS_TICK}, ${QUEUE_CHANNELS.ALERT_CREATED}`
  );

  subscriber.on("message", (channel, message) => {
    if (channel === QUEUE_CHANNELS.EVENT_INGESTED) {
      try {
        const parsed = JSON.parse(message) as IngestedMessage;
        if (!parsed?.event) return;
        broadcastNewEvent(parsed.event as never);
        eventService.getSummary().then(broadcastAnalytics).catch(() => {});
      } catch {
        // ignore malformed messages
      }
      return;
    }

    if (channel === QUEUE_CHANNELS.METRICS_TICK) {
      getSystemMetrics().then(broadcastMetrics).catch(() => {});
      return;
    }

    if (channel === QUEUE_CHANNELS.ALERT_CREATED) {
      try {
        const parsed = JSON.parse(message) as AlertCreatedMessage;
        if (!parsed?.alert) return;
        broadcastAlertCreated(parsed.alert as never);
      } catch {
        // ignore malformed messages
      }
    }
  });
}

export async function closeQueueSubscriber(): Promise<void> {
  if (!subscriber) return;
  await subscriber.quit();
  subscriber = null;
}
