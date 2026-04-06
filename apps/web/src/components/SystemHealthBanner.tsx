"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

export function SystemHealthBanner() {
  const { systemHealth, metrics, overloadNotice } = useDashboardStore();

  if (!metrics && !overloadNotice) return null;
  if (!overloadNotice && systemHealth === "healthy") return null;

  const isOverloaded = overloadNotice || systemHealth === "overloaded";
  const ratio = metrics?.queueMaxSize ? metrics.queueSize / metrics.queueMaxSize : 0;
  const pct = metrics ? Math.min(999, Math.round(ratio * 100)) : null;

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
        isOverloaded
          ? "bg-red-50 border-red-200 text-red-900"
          : "bg-amber-50 border-amber-200 text-amber-900"
      }`}
    >
      <div className="mt-0.5">
        {isOverloaded ? (
          <ShieldAlert className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {isOverloaded ? "System overloaded" : "System under high load"}
        </p>
        <p className="text-xs mt-1 opacity-90">
          {metrics && pct !== null ? (
            <>
              Queue at {pct}% ({metrics.queueSize.toLocaleString()} / {metrics.queueMaxSize.toLocaleString()}).
            </>
          ) : (
            <>Ingestion temporarily rejected (503). </>
          )}
          {isOverloaded ? " Event ingestion may be temporarily rejected (503)." : " Ingestion may slow down."}
        </p>
      </div>
    </div>
  );
}
