import mongoose, { Document, Schema } from "mongoose";

// ─── ExecutionRun ─────────────────────────────────────────────────────────────

export interface IExecutionRun extends Document {
  tenantId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  correlationId: string;
  triggerPayload?: Record<string, unknown>;
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
    triggerPayload: { type: Schema.Types.Mixed },
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

ExecutionRunSchema.index({ tenantId: 1, workflowId: 1, startedAt: -1 });
ExecutionRunSchema.index({ startedAt: 1 }, { expireAfterSeconds: 2592000 });

export const ExecutionRun = mongoose.model<IExecutionRun>(
  "ExecutionRun",
  ExecutionRunSchema,
);

// ─── ExecutionStep ────────────────────────────────────────────────────────────

export interface IExecutionStep extends Document {
  runId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: "success" | "failed" | "skipped";
  startedAt: Date;
  durationMs: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorDetails?: {
    message: string;
    stack?: string;
    retryCount: number;
  };
}

const ExecutionStepSchema = new Schema<IExecutionStep>(
  {
    runId: { type: Schema.Types.ObjectId, ref: "ExecutionRun", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    nodeLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "failed", "skipped"],
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    durationMs: { type: Number, default: 0 },
    inputData: { type: Schema.Types.Mixed },
    outputData: { type: Schema.Types.Mixed },
    errorDetails: {
      message: { type: String },
      stack: { type: String },
      retryCount: { type: Number, default: 0 },
    },
  },
  { timestamps: false },
);

ExecutionStepSchema.index({ runId: 1 });
ExecutionStepSchema.index({ tenantId: 1 });

export const ExecutionStep = mongoose.model<IExecutionStep>(
  "ExecutionStep",
  ExecutionStepSchema,
);
