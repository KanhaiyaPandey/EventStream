"use client";

import { useEffect, useCallback } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, TooltipProps
} from "recharts";
import { Card, CardHeader, CardContent } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";
import { api } from "@/lib/api";
import { formatChartTime } from "@/lib/format";

// Intervals and their friendly labels
const INTERVALS = [
  { value: "minute", label: "1 min", hours: 1 },
  { value: "hour",   label: "24 hr", hours: 24 },
  { value: "day",    label: "30 d",  hours: 720 },
] as const;

// Custom tooltip
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-zinc-500 mb-1 font-mono">{label}</p>
      <p className="font-semibold text-blue-600">{payload[0]?.value} events</p>
    </div>
  );
}

export function TimeseriesChart() {
  const {
    timeseries, timeseriesLoading,
    selectedEventType,
    setTimeseries, setTimeseriesLoading,
  } = useDashboardStore();

  // Default interval state kept locally (doesn't need global state)
  const fetchTimeseries = useCallback(
    async (interval: "minute" | "hour" | "day", hours: number) => {
      setTimeseriesLoading(true);
      try {
        const data = await api.getTimeseries({
          eventType: selectedEventType === "all" ? undefined : selectedEventType,
          interval,
          hours,
        });
        setTimeseries(data.points);
      } catch (err) {
        console.error("Timeseries fetch failed:", err);
        setTimeseries([]);
      }
    },
    [selectedEventType, setTimeseries, setTimeseriesLoading]
  );

  useEffect(() => {
    fetchTimeseries("hour", 24);
  }, [fetchTimeseries]);

  const chartData = timeseries.map((pt) => ({
    time: formatChartTime(pt.time, "hour"),
    count: pt.count,
    raw: pt.time,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              Event Volume
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Events over time</p>
          </div>
          <div className="flex gap-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => fetchTimeseries(iv.value, iv.hours)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {timeseriesLoading ? (
          <div className="h-52 flex items-center justify-center">
            <div className="shimmer w-full h-40 rounded-xl" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-zinc-400">
            No data yet — send some events to see them here.
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4361ee" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4361ee" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4361ee"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#4361ee" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
