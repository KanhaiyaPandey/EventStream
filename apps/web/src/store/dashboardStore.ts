import { create } from "zustand";
import type { EventDocument, AnalyticsSummary, TimeseriesPoint } from "@eventstream/config/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStore {
  // Connection
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Analytics summary
  summary: AnalyticsSummary | null;
  summaryLoading: boolean;
  setSummary: (s: AnalyticsSummary) => void;
  setSummaryLoading: (v: boolean) => void;

  // Live event feed (capped at 100)
  liveFeed: EventDocument[];
  newEventIds: Set<string>;
  pushEvent: (e: EventDocument) => void;
  clearNewFlag: (id: string) => void;

  // Timeseries chart data
  timeseries: TimeseriesPoint[];
  timeseriesLoading: boolean;
  selectedEventType: string;
  setTimeseries: (pts: TimeseriesPoint[]) => void;
  setTimeseriesLoading: (v: boolean) => void;
  setSelectedEventType: (t: string) => void;

  // Events table
  events: EventDocument[];
  eventsTotal: number;
  eventsPage: number;
  eventsLoading: boolean;
  filterEventType: string;
  setEvents: (evts: EventDocument[], total: number) => void;
  setEventsPage: (p: number) => void;
  setEventsLoading: (v: boolean) => void;
  setFilterEventType: (t: string) => void;

  // Available event types for filters
  eventTypes: string[];
  setEventTypes: (t: string[]) => void;
}

const FEED_LIMIT = 100;

export const useDashboardStore = create<DashboardStore>((set) => ({
  // Connection
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  // Summary
  summary: null,
  summaryLoading: true,
  setSummary: (s) => set({ summary: s, summaryLoading: false }),
  setSummaryLoading: (v) => set({ summaryLoading: v }),

  // Live feed
  liveFeed: [],
  newEventIds: new Set(),
  pushEvent: (e) =>
    set((state) => {
      const newFeed = [e, ...state.liveFeed].slice(0, FEED_LIMIT);
      const newIds = new Set(state.newEventIds);
      newIds.add(e._id);
      // Auto-clear "new" flag after 3 seconds
      setTimeout(() => {
        useDashboardStore.getState().clearNewFlag(e._id);
      }, 3000);
      return { liveFeed: newFeed, newEventIds: newIds };
    }),
  clearNewFlag: (id) =>
    set((state) => {
      const newIds = new Set(state.newEventIds);
      newIds.delete(id);
      return { newEventIds: newIds };
    }),

  // Timeseries
  timeseries: [],
  timeseriesLoading: true,
  selectedEventType: "all",
  setTimeseries: (pts) => set({ timeseries: pts, timeseriesLoading: false }),
  setTimeseriesLoading: (v) => set({ timeseriesLoading: v }),
  setSelectedEventType: (t) => set({ selectedEventType: t }),

  // Events table
  events: [],
  eventsTotal: 0,
  eventsPage: 1,
  eventsLoading: true,
  filterEventType: "",
  setEvents: (evts, total) => set({ events: evts, eventsTotal: total, eventsLoading: false }),
  setEventsPage: (p) => set({ eventsPage: p }),
  setEventsLoading: (v) => set({ eventsLoading: v }),
  setFilterEventType: (t) => set({ filterEventType: t, eventsPage: 1 }),

  // Event types
  eventTypes: [],
  setEventTypes: (t) => set({ eventTypes: t }),
}));
