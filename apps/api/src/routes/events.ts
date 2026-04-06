import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getEventById, listEvents } from "../controllers/eventsController";

const router = Router();

// ─── GET /api/events ──────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(listEvents)
);

// ─── GET /api/events/:id ──────────────────────────────────────────────────────

router.get(
  "/:id",
  asyncHandler(getEventById)
);

export { router as eventsRouter };
