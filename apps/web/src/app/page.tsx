import { Navbar } from "@/components/Navbar";
import { StatsRow } from "@/components/StatsRow";
import { TimeseriesChart } from "@/components/TimeseriesChart";
import { EventBreakdown } from "@/components/EventBreakdown";
import { LiveFeed } from "@/components/LiveFeed";
import { EventsTable } from "@/components/EventsTable";
import { EventSender } from "@/components/EventSender";
import { ApiDocs } from "@/components/ApiDocs";
import { DashboardInit } from "@/components/DashboardInit";
import { SystemMetrics } from "@/components/SystemMetrics";
import { SystemHealthBanner } from "@/components/SystemHealthBanner";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Invisible bootstrap — connects WS + loads initial data */}
      <DashboardInit />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ── Hero heading ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display font-800 text-2xl text-zinc-900 tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Real-time event ingestion and visualisation
            </p>
          </div>
          <div className="hidden sm:block text-xs text-zinc-400 font-mono bg-white border border-zinc-200 px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* ── Stats row ── */}
        <StatsRow />

        {/* ── System health banner ── */}
        <SystemHealthBanner />

        {/* ── System metrics ── */}
        <SystemMetrics />

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TimeseriesChart />
          </div>
          <div>
            <EventBreakdown />
          </div>
        </div>

        {/* ── Live feed ── */}
        <LiveFeed />

        {/* ── Events table ── */}
        <EventsTable />

        {/* ── Bottom row: Test sender + API docs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EventSender />
          <ApiDocs />
        </div>

      </main>
    </div>
  );
}
