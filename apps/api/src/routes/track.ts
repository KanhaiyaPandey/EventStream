import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { trackEvent } from "../controllers/trackController";

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
  asyncHandler(trackEvent)
);

export { router as trackRouter };
