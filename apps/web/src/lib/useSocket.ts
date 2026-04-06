"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDashboardStore } from "@/store/dashboardStore";
import type { EventDocument, AnalyticsSummary, SystemMetrics, AlertDocument } from "@eventstream/config/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setWsConnected, pushEvent, setSummary, setMetrics, pushAlert } = useDashboardStore();

  useEffect(() => {
    // Only connect on client side
    if (typeof window === "undefined") return;

    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setWsConnected(true);
      console.info("[WS] Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setWsConnected(false);
      console.warn("[WS] Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
      setWsConnected(false);
    });

    // New event ingested → push to live feed
    socket.on("new_event", (event: EventDocument) => {
      pushEvent(event);
    });

    // Analytics summary updated → refresh stats cards
    socket.on("analytics_update", (summary: AnalyticsSummary) => {
      setSummary(summary);
    });

    socket.on("metrics_update", (metrics: SystemMetrics) => {
      setMetrics(metrics);
    });

    socket.on("alert_created", (alert: AlertDocument) => {
      pushAlert(alert);
    });

    return () => {
      socket.disconnect();
      setWsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef.current;
}
