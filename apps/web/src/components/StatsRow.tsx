"use client";

import { Activity, Users, Zap, TrendingUp } from "lucide-react";
import { StatCard } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";
import { formatNumber } from "@/lib/format";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="shimmer h-3 w-24 rounded-full" />
        <div className="shimmer w-8 h-8 rounded-lg" />
      </div>
      <div className="shimmer h-8 w-20 rounded-lg" />
      <div className="shimmer h-2.5 w-16 rounded-full" />
    </div>
  );
}

export function StatsRow() {
  const { summary, summaryLoading } = useDashboardStore();

  if (summaryLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // Compute events-per-minute from today's count (rough approximation)
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes() || 1;
  const eventsPerMinute = (summary.eventsToday / minutesSinceMidnight).toFixed(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Events"
        value={formatNumber(summary.totalEvents)}
        subtitle="All time ingested"
        icon={<Activity className="w-4 h-4" />}
        accent="blue"
      />
      <StatCard
        title="Unique Users"
        value={formatNumber(summary.uniqueUsers)}
        subtitle="Distinct user IDs"
        icon={<Users className="w-4 h-4" />}
        accent="purple"
      />
      <StatCard
        title="Today"
        value={formatNumber(summary.eventsToday)}
        subtitle="Events since midnight"
        icon={<TrendingUp className="w-4 h-4" />}
        accent="green"
      />
      <StatCard
        title="Avg / min"
        value={eventsPerMinute}
        subtitle="Events per minute today"
        icon={<Zap className="w-4 h-4" />}
        accent="orange"
      />
    </div>
  );
}
