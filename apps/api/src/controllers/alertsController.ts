import type { Request, Response } from "express";
import { z } from "zod";
import { Alert } from "../models/Alert";

const querySchema = z.object({
  severity: z.enum(["info", "warning", "critical"]).optional(),
  type: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

export async function listAlerts(req: Request, res: Response): Promise<void> {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid query parameters",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { severity, type, limit, page } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (severity) filter.severity = severity;
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [alerts, total] = await Promise.all([
    Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      alerts: alerts as unknown[],
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
}

