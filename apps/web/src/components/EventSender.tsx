"use client";

import { useState } from "react";
import { Send, Shuffle } from "lucide-react";
import { Card, CardHeader, CardContent, Badge } from "@eventstream/ui";
import { api } from "@/lib/api";

const SAMPLE_EVENTS = [
  { eventType: "page_view",   userId: "user_001", properties: { url: "/dashboard", referrer: "/login" } },
  { eventType: "click",       userId: "user_002", properties: { element: "signup-button", label: "Get Started" } },
  { eventType: "sign_up",     userId: "user_003", properties: { plan: "pro", method: "email" } },
  { eventType: "purchase",    userId: "user_004", properties: { value: 99.99, currency: "USD", item: "Pro Plan" } },
  { eventType: "feature_used",userId: "user_005", properties: { featureName: "export-csv", category: "data" } },
  { eventType: "error",       userId: "user_006", properties: { errorMessage: "Payment declined", code: 402 } },
  { eventType: "login",       userId: "user_007", properties: { method: "google" } },
  { eventType: "add_to_cart", userId: "user_008", properties: { item: "Enterprise Plan", value: 299 } },
];

export function EventSender() {
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const current = SAMPLE_EVENTS[selectedIdx]!;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await api.trackEvent({
        eventType: current.eventType,
        userId: current.userId,
        properties: current.properties,
      });
      setLastSent(String(res.jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleRandom = async () => {
    const idx = Math.floor(Math.random() * SAMPLE_EVENTS.length);
    setSelectedIdx(idx);
  };

  const handleBurst = async () => {
    setSending(true);
    setError(null);
    try {
      // Send 5 random events in parallel
      await Promise.all(
        Array.from({ length: 5 }, () => {
          const evt = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)]!;
          return api.trackEvent({ eventType: evt.eventType, userId: evt.userId, properties: evt.properties });
        })
      );
      setLastSent("burst-5");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              Test Event Sender
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Fire sample events to see real-time updates</p>
          </div>
          <Badge label="Demo" variant="info" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {/* Event picker */}
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_EVENTS.map((evt, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedIdx === i
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-blue-300"
                }`}
              >
                {evt.eventType}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
            <span className="text-blue-400">POST</span>{" "}
            <span className="text-zinc-500">/api/track</span>
            {"\n"}
            {JSON.stringify(
              { eventType: current.eventType, userId: current.userId, properties: current.properties },
              null, 2
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send Event"}
            </button>
            <button
              onClick={handleRandom}
              disabled={sending}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              title="Pick random event"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handleBurst}
              disabled={sending}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              Burst ×5
            </button>
          </div>

          {/* Feedback */}
          {lastSent && !error && (
            <p className="text-xs text-emerald-600 font-mono">
              ✓ Sent — ID: {lastSent}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500">✗ {error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
