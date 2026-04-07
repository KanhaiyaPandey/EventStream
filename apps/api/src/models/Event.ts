import mongoose, { Document, Schema, Types } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IEvent extends Document {
  _id: Types.ObjectId;
  eventId: string;
  eventType: string;
  userId: string;
  sessionId: string;
  properties: Record<string, unknown>;
  device: {
    userAgent?: string;
    ip?: string;
    country?: string;
    browser?: string;
    os?: string;
    device?: string;
  };
  timestamp: Date;
  createdAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const EventSchema = new Schema<IEvent>(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    userId: {
      type: String,
      default: "anonymous",
      trim: true,
      maxlength: 200,
    },
    sessionId: {
      type: String,
      default: () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      trim: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    device: {
      userAgent: { type: String, maxlength: 500 },
      ip: { type: String, maxlength: 100 },
      country: { type: String, maxlength: 100 },
      browser: { type: String, maxlength: 100 },
      os: { type: String, maxlength: 100 },
      device: { type: String, enum: ["desktop", "mobile", "tablet", "unknown"] },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// ─── Indexes (performance-critical) ──────────────────────────────────────────

// Most common query: recent events of a specific type
EventSchema.index({ eventType: 1, timestamp: -1 });

// Per-user event history
EventSchema.index({ userId: 1, timestamp: -1 });

// Global recency — default dashboard view
EventSchema.index({ timestamp: -1 });

// Analytics aggregation: type counts in a time window
EventSchema.index({ eventType: 1, createdAt: -1 });

// TTL index: auto-delete events older than 90 days (optional, comment to disable)
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─── Serialization ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
EventSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret._id = String(ret._id);
    return ret;
  },
});

export const Event = mongoose.model<IEvent>("Event", EventSchema);
