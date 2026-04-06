"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, TooltipProps } from "recharts";
import { Card, CardHeader, CardContent, Badge } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";

const COLORS = ["#4361ee", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#be185d", "#15803d"];

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-zinc-800">{d?.name}</p>
      <p className="text-zinc-500">{d?.value?.toLocaleString()} events</p>
    </div>
  );
}

export function EventBreakdown() {
  const { summary, summaryLoading } = useDashboardStore();

  const data = summary?.topEventTypes ?? [];

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
          Event Breakdown
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">Distribution by type</p>
      </CardHeader>
      <CardContent>
        {summaryLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="shimmer h-6 rounded-lg" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">No events yet</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Mini pie chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2">
              {data.map((item, i) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <Badge label={item.type} eventType={item.type} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max(item.percentage, 4)}px`,
                        backgroundColor: COLORS[i % COLORS.length],
                        opacity: 0.4,
                        minWidth: "4px",
                        maxWidth: "60px",
                      }}
                    />
                    <span className="text-xs font-mono text-zinc-500 w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
