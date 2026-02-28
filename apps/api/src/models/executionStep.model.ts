import mongoose, { Document, Schema } from "mongoose";

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

// Index for fast run lookup
ExecutionStepSchema.index({ runId: 1 });
ExecutionStepSchema.index({ tenantId: 1 });

export const ExecutionStep = mongoose.model<IExecutionStep>(
  "ExecutionStep",
  ExecutionStepSchema,
);
