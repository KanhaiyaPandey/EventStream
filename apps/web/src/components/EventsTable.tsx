"use client";

import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Table2 } from "lucide-react";
import { Card, CardHeader, CardContent, EventRow, Badge, EmptyState, Spinner } from "@eventstream/ui";
import { useDashboardStore } from "@/store/dashboardStore";
import { api } from "@/lib/api";

const PAGE_SIZE = 20;

export function EventsTable() {
  const {
    events, eventsTotal, eventsPage, eventsLoading,
    filterEventType, eventTypes,
    setEvents, setEventsPage, setEventsLoading, setFilterEventType,
  } = useDashboardStore();

  const fetchEvents = useCallback(
    async (page: number, type: string) => {
      setEventsLoading(true);
      try {
        const res = await api.getEvents({
          eventType: type || undefined,
          limit: PAGE_SIZE,
          page,
        });
        setEvents(res.events, res.total);
      } catch (err) {
        console.error("Events fetch failed:", err);
        setEventsLoading(false);
      }
    },
    [setEvents, setEventsLoading]
  );

  useEffect(() => {
    fetchEvents(eventsPage, filterEventType);
  }, [eventsPage, filterEventType, fetchEvents]);

  const totalPages = Math.ceil(eventsTotal / PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
              All Events
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {eventsTotal.toLocaleString()} events total
            </p>
          </div>

          {/* Filter by event type */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterEventType("")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                !filterEventType
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            {eventTypes.slice(0, 8).map((type) => (
              <button
                key={type}
                onClick={() => setFilterEventType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterEventType === type
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 mt-3 px-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">
          <span className="w-1.5 flex-shrink-0" />
          <span className="w-32 flex-shrink-0">Type</span>
          <span className="w-28 flex-shrink-0">User</span>
          <span className="flex-1">Properties</span>
          <span className="flex-shrink-0">Time</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {eventsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Table2 className="w-5 h-5" />}
            title="No events found"
            description={filterEventType ? `No "${filterEventType}" events yet.` : "Send your first event via POST /api/track"}
          />
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {events.map((event) => (
                <EventRow key={event._id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
                <span className="text-xs text-zinc-400">
                  Page {eventsPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEventsPage(eventsPage - 1)}
                    disabled={eventsPage === 1}
                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setEventsPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          eventsPage === page
                            ? "bg-blue-600 text-white"
                            : "text-zinc-500 hover:bg-zinc-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setEventsPage(eventsPage + 1)}
                    disabled={eventsPage === totalPages}
                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
