import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";

export function getRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  };
}

export function createRedisClient(): Redis {
  return new Redis(env.REDIS_URL, getRedisOptions());
}

