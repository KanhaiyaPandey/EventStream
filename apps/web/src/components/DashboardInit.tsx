"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useSocket } from "@/lib/useSocket";
import { api } from "@/lib/api";

/**
 * Invisible component that:
 * 1. Connects to the WebSocket
 * 2. Bootstraps initial data (summary, recent events, event types)
 */
export function DashboardInit() {
  // Establish WebSocket connection
  useSocket();

  const { setSummary, setSummaryLoading, setEvents, setEventTypes, setMetrics, setAlerts, liveFeed } =
    useDashboardStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // Fetch all initial data in parallel
        const [summary, eventsRes, types, metrics, alertsRes] = await Promise.all([
          api.getSummary(),
          api.getEvents({ limit: 20, page: 1 }),
          api.getEventTypes(),
          api.getMetrics(),
          api.getAlerts({ limit: 20, page: 1 }),
        ]);

        if (cancelled) return;

        setSummary(summary);
        setEvents(eventsRes.events, eventsRes.total);
        setEventTypes(types);
        setMetrics(metrics);
        setAlerts(alertsRes.alerts);
      } catch (err) {
        console.error("Bootstrap failed:", err);
        setSummaryLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [setSummary, setSummaryLoading, setEvents, setEventTypes, setMetrics, setAlerts]);

  // When new live events arrive, also refresh the events table (page 1)
  useEffect(() => {
    if (liveFeed.length === 0) return;
    api.getEvents({ limit: 20, page: 1 }).then((res) => {
      setEvents(res.events, res.total);
    }).catch(() => {});
  // Only re-run when the first item in the feed changes (i.e. a new event arrived)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveFeed[0]?._id]);

  return null;
}
