import type { Request, Response } from "express";
import { env } from "../config/env";
import { getEventQueue, getEventQueueSize } from "../queue/eventQueue";

export async function trackEvent(req: Request, res: Response): Promise<void> {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const userAgent = String(req.headers["user-agent"] ?? "");

  const queueSize = await getEventQueueSize();
  if (queueSize >= env.QUEUE_MAX_SIZE) {
    res.status(503).json({
      success: false,
      error: "Service overloaded. Please retry shortly.",
      details: { queueSize, threshold: env.QUEUE_MAX_SIZE },
    });
    return;
  }

  const queue = getEventQueue();
  const job = await queue.add("ingestEvent", {
    payload: req.body,
    requestMeta: { ip, userAgent },
  }, {
    jobId: req.body.eventId,
  });

  res.status(202).json({ success: true, data: { jobId: job.id } });
}
