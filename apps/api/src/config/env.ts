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
  NODE_ENV: optional("NODE_ENV", "development"),
  isDev: optional("NODE_ENV", "development") === "development",
} as const;
