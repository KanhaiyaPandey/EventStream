import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { env } from "../config/env";

export type RateLimiterOptions = {
  windowMs?: number;
  max?: number;
  message?: unknown;
};

export function createRateLimiter(opts: RateLimiterOptions = {}): RateLimitRequestHandler {
  const windowMs = opts.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = opts.max ?? env.RATE_LIMIT_MAX;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: opts.message ?? { success: false, error: "Too many requests, please slow down." },
  });
}

