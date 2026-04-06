"use client";

import { Card, CardHeader, CardContent, Badge, EmptyState } from "@eventstream/ui";
import { Bell } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

function severityVariant(sev: string): "info" | "warning" | "danger" {
  if (sev === "critical") return "danger";
  if (sev === "warning") return "warning";
  return "info";
}

export function AlertsList() {
  const alerts = useDashboardStore((s) => s.alerts);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              Alerts
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Anomaly and system alerts</p>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {alerts.length.toLocaleString()} loaded
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Bell className="w-5 h-5" />}
              title="No alerts"
              description="Alerts will appear here when anomalies are detected."
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {alerts.map((a) => (
              <div key={a._id} className="px-5 py-4 flex items-start gap-3">
                <Badge label={a.severity} variant={severityVariant(a.severity)} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-900 font-medium">{a.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono">{a.type}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(a.timestamp).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

