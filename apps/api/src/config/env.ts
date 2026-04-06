import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  PORT: parseInt(optional("PORT", "4000"), 10),
  MONGODB_URI: optional("MONGODB_URI", "mongodb://localhost:27017/eventstream"),
  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:3000"),
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),
  QUEUE_MAX_SIZE: parseInt(optional("QUEUE_MAX_SIZE", "10000"), 10),
  RATE_LIMIT_WINDOW_MS: parseInt(optional("RATE_LIMIT_WINDOW_MS", String(60 * 1000)), 10),
  RATE_LIMIT_MAX: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),
  ALERT_COOLDOWN_SECONDS: parseInt(optional("ALERT_COOLDOWN_SECONDS", "300"), 10),
  NODE_ENV: optional("NODE_ENV", "development"),
  isDev: optional("NODE_ENV", "development") === "development",
} as const;
