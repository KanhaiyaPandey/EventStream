import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import {
  getEventTypes,
  getSummary,
  getTimeseries,
  health,
  queryAnalytics,
} from "../controllers/analyticsController";

const router = Router();

// ─── GET /api/analytics/summary ───────────────────────────────────────────────

router.get("/summary", asyncHandler(getSummary));

// ─── GET /api/analytics/timeseries ────────────────────────────────────────────

router.get("/timeseries", asyncHandler(getTimeseries));

// ─── GET /api/analytics/event-types ──────────────────────────────────────────

router.get("/event-types", asyncHandler(getEventTypes));

router.get("/query", asyncHandler(queryAnalytics));

// ─── GET /api/health ──────────────────────────────────────────────────────────

router.get("/health", asyncHandler(health));

export { router as analyticsRouter };
