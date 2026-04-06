"use client";

import { Activity } from "lucide-react";
import { LiveDot } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";

export function Navbar() {
  const wsConnected = useDashboardStore((s) => s.wsConnected);
  const summary = useDashboardStore((s) => s.summary);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-700 text-zinc-900 text-lg tracking-tight">
            Event<span className="text-blue-600">Stream</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {summary && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="font-mono font-medium text-zinc-700">
                {summary.totalEvents.toLocaleString()}
              </span>
              <span>total events</span>
            </div>
          )}
          <div className="h-4 w-px bg-zinc-200" />
          <LiveDot
            connected={wsConnected}
            label={wsConnected ? "Live" : "Offline"}
          />
        </div>
      </div>
    </header>
  );
}
