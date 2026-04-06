import type { Request, Response } from "express";
import { getSystemMetrics } from "../services/metricsService";

export async function getMetrics(_req: Request, res: Response): Promise<void> {
  const metrics = await getSystemMetrics();
  res.json({ success: true, data: metrics });
}

