import mongoose, { Document, Schema, Types } from "mongoose";

export type AlertSeverity = "info" | "warning" | "critical";

export interface IAlert extends Document {
  _id: Types.ObjectId;
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    type: { type: String, required: true, trim: true, maxlength: 100, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, required: true, enum: ["info", "warning", "critical"], index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ type: 1, timestamp: -1 });
AlertSchema.index({ severity: 1, timestamp: -1 });

AlertSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret._id = String(ret._id);
    return ret;
  },
});

export const Alert = mongoose.model<IAlert>("Alert", AlertSchema);
