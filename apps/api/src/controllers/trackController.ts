import type { Request, Response } from "express";
import { getEventQueue } from "../queue/eventQueue";

export async function trackEvent(req: Request, res: Response): Promise<void> {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const userAgent = String(req.headers["user-agent"] ?? "");

  const queue = getEventQueue();
  const job = await queue.add("ingestEvent", {
    payload: req.body,
    requestMeta: { ip, userAgent },
  });

  res.status(202).json({ success: true, data: { jobId: job.id } });
}

