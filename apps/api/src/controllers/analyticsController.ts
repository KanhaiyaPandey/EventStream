import type { Request, Response } from "express";
import { z } from "zod";
import { eventService } from "../services/eventService";
import { getConnectedClients } from "../services/socketService";
import { Event } from "../models/Event";

const timeseriesSchema = z.object({
  eventType: z.string().optional(),
  interval: z.enum(["minute", "hour", "day"]).default("hour"),
  hours: z.coerce.number().int().min(1).max(720).default(24),
});

const querySchema = z.object({
  eventType: z.string().optional(),
  timeRange: z
    .string()
    .regex(/^\d+(m|h|d)$/i, 'timeRange must look like "1h", "24h", "30m", "7d"')
    .default("24h"),
});

function timeRangeToMs(range: string): number {
  const m = range.match(/^(\d+)(m|h|d)$/i);
  if (!m) return 24 * 60 * 60 * 1000;
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === "m" ? 60 * 1000 : unit === "h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return value * mult;
}

export async function getSummary(_req: Request, res: Response): Promise<void> {
  const summary = await eventService.getSummary();
  res.json({
    success: true,
    data: {
      ...summary,
      connectedClients: getConnectedClients(),
    },
  });
}

export async function getTimeseries(req: Request, res: Response): Promise<void> {
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
}

export async function getEventTypes(_req: Request, res: Response): Promise<void> {
  const types = await Event.distinct("eventType");
  res.json({ success: true, data: types.sort() });
}

export async function queryAnalytics(req: Request, res: Response): Promise<void> {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid query parameters",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { eventType, timeRange } = parsed.data;
  const to = new Date();
  const from = new Date(to.getTime() - timeRangeToMs(timeRange));

  const result = await eventService.query({ eventType, from, to });
  res.json({ success: true, data: { ...result, timeRange, eventType: eventType ?? null } });
}

export async function health(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      connectedClients: getConnectedClients(),
      timestamp: new Date().toISOString(),
    },
  });
}

