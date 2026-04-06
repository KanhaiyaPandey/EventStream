import type { Request, Response } from "express";
import { z } from "zod";
import { eventService } from "../services/eventService";
import { Event } from "../models/Event";

const listQuerySchema = z.object({
  eventType: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function listEvents(req: Request, res: Response): Promise<void> {
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

  res.json({ success: true, data: result });
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const event = await Event.findById(req.params.id).lean();
  if (!event) {
    res.status(404).json({ success: false, error: "Event not found" });
    return;
  }
  res.json({ success: true, data: event });
}

