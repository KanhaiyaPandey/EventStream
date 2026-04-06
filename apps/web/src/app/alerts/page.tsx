import { Navbar } from "@/components/Navbar";
import { AlertsInit } from "@/components/AlertsInit";
import { AlertsList } from "@/components/AlertsList";
import { SystemHealthBanner } from "@/components/SystemHealthBanner";
import { SystemMetrics } from "@/components/SystemMetrics";

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AlertsInit />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display font-800 text-2xl text-zinc-900 tracking-tight">
              Alerts
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Persisted anomaly alerts (real-time)
            </p>
          </div>
        </div>

        <SystemHealthBanner />
        <SystemMetrics />
        <AlertsList />
      </main>
    </div>
  );
}

