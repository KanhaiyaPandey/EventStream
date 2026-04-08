"use client";

import { Activity } from "lucide-react";
import { LiveDot } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export function Navbar() {
  const wsConnected = useDashboardStore((s) => s.wsConnected);
  const summary = useDashboardStore((s) => s.summary);
  const alertsCount = useDashboardStore((s) => s.alerts.length);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-zinc-900 text-lg tracking-tight">
              Event<span className="text-blue-600">Stream</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <Link href="/" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/alerts" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Alerts
              {alertsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {alertsCount > 99 ? "99+" : alertsCount}
                </span>
              )}
            </Link>
          </nav>
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
          <div>
            <a
              href="https://github.com/KanhaiyaPandey/EventStream"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="h-5 w-5 text-zinc-600 hover:text-zinc-900 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
