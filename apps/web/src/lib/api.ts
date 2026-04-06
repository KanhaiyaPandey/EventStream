import type {
  AnalyticsSummary,
  TimeseriesResponse,
  EventDocument,
  TrackEventPayload,
} from "@eventstream/config/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
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

  trackEvent(payload: TrackEventPayload): Promise<{ jobId: string | number }> {
    return apiFetch("/api/track", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
