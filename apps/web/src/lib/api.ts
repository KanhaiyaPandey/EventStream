import type {
  AnalyticsSummary,
  TimeseriesResponse,
  EventDocument,
  TrackEventPayload,
  SystemMetrics,
  AlertDocument,
} from "@eventstream/config/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiRequestError(json.error ?? `HTTP ${res.status}`, res.status, json.details);
  }
  return json.data as T;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const api = {
  getSummary(): Promise<AnalyticsSummary & { connectedClients: number }> {
    return apiFetch("/api/analytics/summary");
  },

  getTimeseries(opts: {
    eventType?: string;
    interval?: "minute" | "hour" | "day";
    hours?: number;
  }): Promise<TimeseriesResponse> {
    const params = new URLSearchParams();
    if (opts.eventType && opts.eventType !== "all") params.set("eventType", opts.eventType);
    if (opts.interval) params.set("interval", opts.interval);
    if (opts.hours) params.set("hours", String(opts.hours));
    return apiFetch(`/api/analytics/timeseries?${params}`);
  },

  getEventTypes(): Promise<string[]> {
    return apiFetch("/api/analytics/event-types");
  },

  getEvents(opts: {
    eventType?: string;
    userId?: string;
    limit?: number;
    page?: number;
  }): Promise<{ events: EventDocument[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams();
    if (opts.eventType) params.set("eventType", opts.eventType);
    if (opts.userId) params.set("userId", opts.userId);
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.page) params.set("page", String(opts.page));
    return apiFetch(`/api/events?${params}`);
  },

  getMetrics(): Promise<SystemMetrics> {
    return apiFetch("/api/metrics");
  },

  getAlerts(opts: {
    severity?: "info" | "warning" | "critical";
    type?: string;
    limit?: number;
    page?: number;
  }): Promise<{ alerts: AlertDocument[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams();
    if (opts.severity) params.set("severity", opts.severity);
    if (opts.type) params.set("type", opts.type);
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.page) params.set("page", String(opts.page));
    return apiFetch(`/api/alerts?${params}`);
  },

  trackEvent(payload: TrackEventPayload): Promise<{ jobId: string | number }> {
    return apiFetch("/api/track", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
