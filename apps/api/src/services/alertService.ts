import type Redis from "ioredis";

export type AlertLevel = "info" | "warn" | "error";

export type Alert = {
  key: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export interface AlertSink {
  send(alert: Alert): Promise<void>;
}

export class ConsoleAlertSink implements AlertSink {
  async send(alert: Alert): Promise<void> {
    const line = JSON.stringify(alert);
    if (alert.level === "error") console.error(line);
    else if (alert.level === "warn") console.warn(line);
    else console.info(line);
  }
}

export class AlertService {
  private sinks: AlertSink[];
  private redis: Redis;
  private cooldownSeconds: number;

  constructor(opts: { sinks?: AlertSink[]; redis: Redis; cooldownSeconds: number }) {
    this.sinks = opts.sinks?.length ? opts.sinks : [new ConsoleAlertSink()];
    this.redis = opts.redis;
    this.cooldownSeconds = Math.max(1, opts.cooldownSeconds);
  }

  private cooldownKey(key: string): string {
    return `eventstream:alerts:cooldown:${key}`;
  }

  async trigger(alert: Omit<Alert, "timestamp">): Promise<boolean> {
    const now = new Date().toISOString();
    const key = this.cooldownKey(alert.key);

    const set = await this.redis.set(key, "1", "EX", this.cooldownSeconds, "NX");
    if (!set) return false;

    const full: Alert = { ...alert, timestamp: now };
    await Promise.allSettled(this.sinks.map((s) => s.send(full)));
    return true;
  }
}

