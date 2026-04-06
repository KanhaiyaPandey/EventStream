import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { eventService } from "../services/eventService";
import { broadcastNewEvent, broadcastAnalytics } from "../services/socketService";

const router = Router();

// ─── Validation Schema ────────────────────────────────────────────────────────

const trackSchema = z.object({
  eventType: z
    .string()
    .min(1, "eventType is required")
    .max(100, "eventType too long")
    .trim(),
  userId: z.string().max(200).trim().optional(),
  sessionId: z.string().max(200).trim().optional(),
  properties: z.record(z.unknown()).optional().default({}),
  timestamp: z
    .string()
    .datetime({ message: "timestamp must be an ISO 8601 string" })
    .optional(),
});

// ─── POST /api/track ──────────────────────────────────────────────────────────

router.post(
  "/",
  validate(trackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const userAgent = req.headers["user-agent"] ?? "";

    // Persist the event
    const event = await eventService.track(req.body, { ip, userAgent });

    // Real-time broadcast to dashboard clients (non-blocking)
    broadcastNewEvent(event);

    // Update analytics summary in real-time (fire-and-forget)
    eventService.getSummary().then(broadcastAnalytics).catch(() => {});

    res.status(201).json({
      success: true,
      data: { eventId: event._id, eventType: event.eventType, timestamp: event.timestamp },
    });
  })
);

export { router as trackRouter };
