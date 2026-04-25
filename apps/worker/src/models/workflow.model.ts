// Same model as apps/api/src/models/workflow.model.ts
// Duplicated here so the worker can read workflows from MongoDB independently
import mongoose, { Document, Schema } from "mongoose";

export interface INode {
  id: string;
  nodeType: "trigger" | "action" | "logic_gate" | "transformer";
  subType: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface IEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
}

export interface IWorkflow extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  nodes: INode[];
  edges: IEdge[];
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      baseDelayMs: number;
      backoffMultiplier: number;
    };
    errorBehavior: "stop" | "continue";
  };
  trigger: {
    type: "webhook" | "schedule" | "manual";
    config: Record<string, unknown>;
    webhookId?: string;
  };
}

const NodeSchema = new Schema<INode>(
  {
    id: { type: String, required: true },
    nodeType: {
      type: String,
      enum: ["trigger", "action", "logic_gate", "transformer"],
      required: true,
    },
    subType: { type: String, required: true },
    label: { type: String, required: true },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const EdgeSchema = new Schema<IEdge>(
  {
    id: { type: String, required: true },
    sourceNodeId: { type: String, required: true },
    targetNodeId: { type: String, required: true },
    sourcePort: { type: String, default: "output" },
    targetPort: { type: String, default: "input" },
  },
  { _id: false },
);

const WorkflowSchema = new Schema<IWorkflow>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "draft",
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    settings: {
      timeout: { type: Number, default: 30000 },
      retryPolicy: {
        maxRetries: { type: Number, default: 3 },
        baseDelayMs: { type: Number, default: 1000 },
        backoffMultiplier: { type: Number, default: 2 },
      },
      errorBehavior: {
        type: String,
        enum: ["stop", "continue"],
        default: "stop",
      },
    },
    trigger: {
      type: {
        type: String,
        enum: ["webhook", "schedule", "manual"],
        default: "manual",
      },
      config: { type: Schema.Types.Mixed, default: {} },
      webhookId: { type: String },
    },
  },
  { timestamps: true },
);

export const Workflow = mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
