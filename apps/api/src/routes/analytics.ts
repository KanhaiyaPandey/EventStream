import { Router, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { eventService } from "../services/eventService";
import { getConnectedClients } from "../services/socketService";

const router = Router();

// ─── GET /api/analytics/summary ───────────────────────────────────────────────

router.get(
  "/summary",
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await eventService.getSummary();
    res.json({
      success: true,
      data: {
        ...summary,
        connectedClients: getConnectedClients(),
      },
    });
  })
);

// ─── GET /api/analytics/timeseries ────────────────────────────────────────────

const timeseriesSchema = z.object({
  eventType: z.string().optional(),
  interval: z.enum(["minute", "hour", "day"]).default("hour"),
  hours: z.coerce.number().int().min(1).max(720).default(24),
});

router.get(
  "/timeseries",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = timeseriesSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const timeseries = await eventService.getTimeseries(parsed.data);
    res.json({ success: true, data: timeseries });
  })
);

// ─── GET /api/analytics/event-types ──────────────────────────────────────────

router.get(
  "/event-types",
  asyncHandler(async (_req: Request, res: Response) => {
    const { Event } = await import("../models/Event");
    const types = await Event.distinct("eventType");
    res.json({ success: true, data: types.sort() });
  })
);

// ─── GET /api/health ──────────────────────────────────────────────────────────

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      connectedClients: getConnectedClients(),
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as analyticsRouter };
