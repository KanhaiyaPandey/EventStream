"use client";

import { Radio } from "lucide-react";
import { Card, CardHeader, CardContent, EventRow, EmptyState, LiveDot } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";

export function LiveFeed() {
  const { liveFeed, newEventIds, wsConnected } = useDashboardStore();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              Live Feed
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Incoming events in real-time</p>
          </div>
          <LiveDot connected={wsConnected} label={wsConnected ? "Streaming" : "Offline"} />
        </div>
        {/* Column headers */}
        {liveFeed.length > 0 && (
          <div className="flex items-center gap-3 mt-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">
            <span className="w-1.5 flex-shrink-0" />
            <span className="w-32 flex-shrink-0">Type</span>
            <span className="w-28 flex-shrink-0">User</span>
            <span className="flex-1">Properties</span>
            <span className="flex-shrink-0">Time</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 max-h-80 overflow-y-auto">
        {liveFeed.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-5 h-5" />}
            title="Waiting for events"
            description="Events will appear here in real-time as they are ingested via POST /api/track"
          />
        ) : (
          liveFeed.map((event) => (
            <EventRow
              key={event._id}
              event={event}
              isNew={newEventIds.has(event._id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
