import type Redis from "ioredis";

export type Anomaly = {
  key: string;
  eventType: string;
  bucketStart: string;
  current: number;
  average: number;
  multiplier: number;
  windowBuckets: number;
};

function floorToMinute(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

function bucketId(date: Date): string {
  const d = floorToMinute(date);
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}`;
}

export class AnomalyDetectionService {
  private redis: Redis;
  private windowBuckets: number;
  private multiplier: number;
  private minCurrent: number;
  private ttlSeconds: number;

  constructor(opts: {
    redis: Redis;
    windowBuckets?: number;
    multiplier?: number;
    minCurrent?: number;
    ttlSeconds?: number;
  }) {
    this.redis = opts.redis;
    this.windowBuckets = Math.max(3, opts.windowBuckets ?? 10);
    this.multiplier = Math.max(1.1, opts.multiplier ?? 2);
    this.minCurrent = Math.max(1, opts.minCurrent ?? 20);
    this.ttlSeconds = Math.max(60, opts.ttlSeconds ?? 3 * 60 * 60);
  }

  private countKey(eventType: string, minuteBucket: string): string {
    return `eventstream:anomaly:count:${eventType}:${minuteBucket}`;
  }

  async recordAndDetect(opts: { eventType: string; at?: Date }): Promise<Anomaly | null> {
    const at = opts.at ?? new Date();
    const bucket = bucketId(at);
    const start = floorToMinute(at).toISOString();
    const eventType = opts.eventType || "unknown";

    const currentKey = this.countKey(eventType, bucket);
    const current = await this.redis.incr(currentKey);
    await this.redis.expire(currentKey, this.ttlSeconds);

    const prevKeys: string[] = [];
    for (let i = 1; i <= this.windowBuckets; i++) {
      const prev = new Date(at.getTime() - i * 60 * 1000);
      prevKeys.push(this.countKey(eventType, bucketId(prev)));
    }

    const prev = await this.redis.mget(prevKeys);
    const nums = prev
      .map((v) => (v ? Number(v) : 0))
      .filter((n) => Number.isFinite(n));
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

    if (current < this.minCurrent) return null;
    if (avg <= 0) return null;
    if (current <= avg * this.multiplier) return null;

    const key = `anomaly:${eventType}:${bucket}`;
    return {
      key,
      eventType,
      bucketStart: start,
      current,
      average: avg,
      multiplier: this.multiplier,
      windowBuckets: this.windowBuckets,
    };
  }
}

