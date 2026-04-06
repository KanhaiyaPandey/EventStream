import { Event, IEvent } from "../models/Event";
import type {
  TrackEventPayload,
  AnalyticsSummary,
  TimeseriesResponse,
  EventDocument,
} from "@eventstream/config/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseUserAgent(ua: string = ""): {
  browser: string;
  os: string;
  device: string;
} {
  const browser = ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Firefox")
    ? "Firefox"
    : ua.includes("Safari")
    ? "Safari"
    : ua.includes("Edge")
    ? "Edge"
    : "Unknown";

  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
    ? "macOS"
    : ua.includes("Linux")
    ? "Linux"
    : ua.includes("Android")
    ? "Android"
    : ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : "Unknown";

  const device = ua.includes("Mobile") ? "mobile" : ua.includes("Tablet") ? "tablet" : "desktop";

  return { browser, os, device };
}

function docToEvent(doc: IEvent): EventDocument {
  const obj = doc.toJSON() as Record<string, unknown>;
  return obj as unknown as EventDocument;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const eventService = {
  /**
   * Ingest a new event from the track endpoint.
   */
  async track(
    payload: TrackEventPayload,
    requestMeta: { ip: string; userAgent: string }
  ): Promise<EventDocument> {
    const { browser, os, device } = parseUserAgent(requestMeta.userAgent);

    const event = await Event.create({
      eventId: payload.eventId,
      eventType: payload.eventType,
      userId: payload.userId ?? "anonymous",
      sessionId: payload.sessionId,
      properties: payload.properties ?? {},
      device: {
        userAgent: requestMeta.userAgent,
        ip: requestMeta.ip,
        browser,
        os,
        device,
      },
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });

    return docToEvent(event);
  },

  /**
   * Fetch paginated events with optional filters.
   */
  async getEvents(opts: {
    eventType?: string;
    userId?: string;
    limit: number;
    page: number;
    from?: Date;
    to?: Date;
  }): Promise<{ events: EventDocument[]; total: number; page: number; pages: number }> {
    const filter: Record<string, unknown> = {};
    if (opts.eventType) filter.eventType = opts.eventType;
    if (opts.userId) filter.userId = opts.userId;
    if (opts.from || opts.to) {
      filter.timestamp = {
        ...(opts.from && { $gte: opts.from }),
        ...(opts.to && { $lte: opts.to }),
      };
    }

    const skip = (opts.page - 1) * opts.limit;
    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(opts.limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return {
      events: events as unknown as EventDocument[],
      total,
      page: opts.page,
      pages: Math.ceil(total / opts.limit),
    };
  },

  /**
   * Build the analytics summary for the dashboard.
   */
  async getSummary(): Promise<AnalyticsSummary> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [totalEvents, eventsToday, uniqueUsersResult, breakdownResult, recentDocs] =
      await Promise.all([
        // Total event count
        Event.countDocuments(),

        // Events today
        Event.countDocuments({ timestamp: { $gte: startOfDay } }),

        // Unique users (approximated via distinct)
        Event.distinct("userId"),

        // Count per event type
        Event.aggregate([
          { $group: { _id: "$eventType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // 20 most recent events
        Event.find().sort({ timestamp: -1 }).limit(20).lean(),
      ]);

    const eventBreakdown: Record<string, number> = {};
    for (const item of breakdownResult) {
      eventBreakdown[item._id as string] = item.count as number;
    }

    const topEventTypes = breakdownResult.slice(0, 6).map((item) => ({
      type: item._id as string,
      count: item.count as number,
      percentage:
        totalEvents > 0 ? Math.round(((item.count as number) / totalEvents) * 100) : 0,
    }));

    return {
      totalEvents,
      uniqueUsers: uniqueUsersResult.length,
      eventsToday,
      eventBreakdown,
      topEventTypes,
      recentActivity: recentDocs as unknown as EventDocument[],
    };
  },

  /**
   * Time-series data for a line chart.
   */
  async getTimeseries(opts: {
    eventType?: string;
    interval: "minute" | "hour" | "day";
    hours: number;
  }): Promise<TimeseriesResponse> {
    const since = new Date(Date.now() - opts.hours * 60 * 60 * 1000);

    const matchStage: Record<string, unknown> = { timestamp: { $gte: since } };
    if (opts.eventType) matchStage.eventType = opts.eventType;

    // Build the date-format string based on interval
    const dateFormat =
      opts.interval === "minute"
        ? "%Y-%m-%dT%H:%M:00Z"
        : opts.interval === "hour"
        ? "%Y-%m-%dT%H:00:00Z"
        : "%Y-%m-%dT00:00:00Z";

    const result = await Event.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      eventType: opts.eventType ?? "all",
      interval: opts.interval,
      points: result.map((r) => ({
        time: r._id as string,
        count: r.count as number,
      })),
    };
  },

  async query(opts: {
    eventType?: string;
    from: Date;
    to: Date;
  }): Promise<{
    count: number;
    groupedByEventType: Array<{ eventType: string; count: number }>;
    groupedByHour: Array<{ hour: string; count: number }>;
    from: string;
    to: string;
  }> {
    const match: Record<string, unknown> = {
      timestamp: { $gte: opts.from, $lte: opts.to },
    };
    if (opts.eventType) match.eventType = opts.eventType;

    const [count, groupedByEventType, groupedByHour] = await Promise.all([
      Event.countDocuments(match),
      Event.aggregate([
        { $match: match },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      Event.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%dT%H:00:00Z", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      count,
      groupedByEventType: groupedByEventType.map((x) => ({
        eventType: x._id as string,
        count: x.count as number,
      })),
      groupedByHour: groupedByHour.map((x) => ({
        hour: x._id as string,
        count: x.count as number,
      })),
      from: opts.from.toISOString(),
      to: opts.to.toISOString(),
    };
  },
};
