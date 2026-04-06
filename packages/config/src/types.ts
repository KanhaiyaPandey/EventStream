// ─── Core Event Types ──────────────────────────────────────────────────────────

export type EventType =
  | "page_view"
  | "click"
  | "form_submit"
  | "sign_up"
  | "login"
  | "logout"
  | "purchase"
  | "add_to_cart"
  | "api_call"
  | "error"
  | "feature_used"
  | "session_start"
  | "session_end"
  | "custom";

export interface EventProperties {
  url?: string;
  referrer?: string;
  element?: string;
  value?: number;
  currency?: string;
  label?: string;
  category?: string;
  errorMessage?: string;
  featureName?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  country?: string;
  browser?: string;
  os?: string;
  device?: "desktop" | "mobile" | "tablet";
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface TrackEventPayload {
  eventId: string;
  eventType: EventType | string;
  userId?: string;
  sessionId?: string;
  properties?: EventProperties;
  timestamp?: string; // ISO 8601
}

export interface EventDocument {
  _id: string;
  eventId: string;
  eventType: string;
  userId: string;
  sessionId: string;
  properties: EventProperties;
  device: DeviceInfo;
  timestamp: string;
  createdAt: string;
}

export interface SystemMetrics {
  totalProcessedJobs: number;
  totalFailedJobs: number;
  queueSize: number;
  queueMaxSize: number;
  avgProcessingTimeMs: number;
  activeWorkers: number;
  updatedAt: string;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertDocument {
  _id: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface EventBreakdown {
  [eventType: string]: number;
}

export interface TimeseriesPoint {
  time: string;
  count: number;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  eventsToday: number;
  eventBreakdown: EventBreakdown;
  topEventTypes: Array<{ type: string; count: number; percentage: number }>;
  recentActivity: EventDocument[];
}

export interface TimeseriesResponse {
  eventType: string;
  interval: "minute" | "hour" | "day";
  points: TimeseriesPoint[];
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WSEventPayload {
  type: "new_event" | "analytics_update" | "metrics_update" | "alert_created";
  data: EventDocument | AnalyticsSummary | SystemMetrics | AlertDocument;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
