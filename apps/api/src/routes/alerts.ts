import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { listAlerts } from "../controllers/alertsController";

const router = Router();

router.get("/", asyncHandler(listAlerts));

export { router as alertsRouter };

