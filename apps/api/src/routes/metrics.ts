import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getMetrics } from "../controllers/metricsController";

const router = Router();

router.get("/", asyncHandler(getMetrics));

export { router as metricsRouter };

