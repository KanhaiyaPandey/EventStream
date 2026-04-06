"use client";

import { useEffect } from "react";
import { useSocket } from "@/lib/useSocket";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";

export function AlertsInit() {
  useSocket();

  const { setAlerts, setMetrics, setMetricsLoading } = useDashboardStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [alertsRes, metrics] = await Promise.all([
          api.getAlerts({ limit: 50, page: 1 }),
          api.getMetrics(),
        ]);
        if (cancelled) return;
        setAlerts(alertsRes.alerts);
        setMetrics(metrics);
      } catch {
        setMetricsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setAlerts, setMetrics, setMetricsLoading]);

  return null;
}

