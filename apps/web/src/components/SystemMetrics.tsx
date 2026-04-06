"use client";

import type { ReactNode } from "react";
import { Card, CardHeader, CardContent, Badge } from "@eventstream/ui";
import { Activity, Gauge, Clock, Server, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";

function MetricTile(props: { label: string; value: string; icon: ReactNode; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-zinc-500">{props.label}</p>
        <p className="text-lg font-semibold text-zinc-900 mt-1">{props.value}</p>
        {props.hint && <p className="text-[11px] text-zinc-400 mt-1">{props.hint}</p>}
      </div>
      <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600">
        {props.icon}
      </div>
    </div>
  );
}

export function SystemMetrics() {
  const { metrics, metricsLoading, metricsHistory, systemHealth } = useDashboardStore();

  const healthBadge =
    systemHealth === "healthy"
      ? { label: "Healthy", variant: "success" as const }
      : systemHealth === "high_load"
        ? { label: "High Load", variant: "warning" as const }
        : { label: "Overloaded", variant: "danger" as const };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              System Metrics
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Queue, workers, and processing health</p>
          </div>
          <Badge label={healthBadge.label} variant={healthBadge.variant} />
        </div>
      </CardHeader>
      <CardContent>
        {metricsLoading || !metrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricTile
                label="Queue Size"
                value={`${metrics.queueSize.toLocaleString()} / ${metrics.queueMaxSize.toLocaleString()}`}
                hint="Waiting + active + delayed"
                icon={<Gauge className="w-4 h-4" />}
              />
              <MetricTile
                label="Processed Jobs"
                value={metrics.totalProcessedJobs.toLocaleString()}
                icon={<Activity className="w-4 h-4" />}
              />
              <MetricTile
                label="Failed Jobs"
                value={metrics.totalFailedJobs.toLocaleString()}
                icon={<AlertTriangle className="w-4 h-4" />}
              />
              <MetricTile
                label="Avg Processing"
                value={`${metrics.avgProcessingTimeMs.toLocaleString()} ms`}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricTile
                label="Active Workers"
                value={metrics.activeWorkers.toLocaleString()}
                icon={<Server className="w-4 h-4" />}
              />
            </div>

            <div className="h-40 bg-white rounded-xl border border-zinc-200 shadow-sm p-3">
              {metricsHistory.length < 2 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  Waiting for metric updates…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="qFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        borderColor: "#e4e4e7",
                        fontSize: 12,
                      }}
                      formatter={(v) => [`${v}`, "Queue"]}
                      labelFormatter={(l) => `Time: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="queueSize"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fill="url(#qFill)"
                      dot={false}
                      activeDot={{ r: 3, fill: "#0ea5e9" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
