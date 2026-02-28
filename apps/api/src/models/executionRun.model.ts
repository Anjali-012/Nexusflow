import mongoose, { Document, Schema } from "mongoose";

export interface IExecutionRun extends Document {
  tenantId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  correlationId: string;
  status: "running" | "success" | "failed" | "partial" | "cancelled";
  triggeredBy: "webhook" | "manual" | "schedule";
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  errorMessage?: string;
}

const ExecutionRunSchema = new Schema<IExecutionRun>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    correlationId: { type: String, required: true },
    status: {
      type: String,
      enum: ["running", "success", "failed", "partial", "cancelled"],
      default: "running",
    },
    triggeredBy: {
      type: String,
      enum: ["webhook", "manual", "schedule"],
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    durationMs: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: false },
);

// Indexes per SRS
ExecutionRunSchema.index({ tenantId: 1, workflowId: 1, startedAt: -1 });
// TTL — auto-delete after 30 days
ExecutionRunSchema.index({ startedAt: 1 }, { expireAfterSeconds: 2592000 });

export const ExecutionRun = mongoose.model<IExecutionRun>(
  "ExecutionRun",
  ExecutionRunSchema,
);
