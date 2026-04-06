import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { eventService } from "../services/eventService";

const router = Router();

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  eventType: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ─── GET /api/events ──────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { eventType, userId, limit, page, from, to } = parsed.data;

    const result = await eventService.getEvents({
      eventType,
      userId,
      limit,
      page,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// ─── GET /api/events/:id ──────────────────────────────────────────────────────

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { Event } = await import("../models/Event");
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    res.json({ success: true, data: event });
  })
);

export { router as eventsRouter };
