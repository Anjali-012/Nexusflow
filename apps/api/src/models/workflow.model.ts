import mongoose, { Document, Schema } from "mongoose";

// Node interface
export interface INode {
  id: string;
  nodeType: "trigger" | "action" | "logic_gate" | "transformer";
  subType: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

// Edge interface
export interface IEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
}

// Workflow interface
export interface IWorkflow extends Document {
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "archived";
  nodes: INode[];
  edges: IEdge[];
  trigger: {
    type: "webhook" | "schedule" | "manual";
    config: Record<string, any>;
    webhookId?: string;
  };
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      baseDelayMs: number;
      backoffMultiplier: number;
    };
    errorBehavior: "stop" | "continue";
  };
  createdAt: Date;
  updatedAt: Date;
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
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "draft",
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    trigger: {
      type: {
        type: String,
        enum: ["webhook", "schedule", "manual"],
        default: "manual",
      },
      config: { type: Schema.Types.Mixed, default: {} },
      webhookId: { type: String },
    },
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
  },
  { timestamps: true },
);

// Indexes for fast queries
WorkflowSchema.index({ tenantId: 1, status: 1 });
WorkflowSchema.index({ "trigger.webhookId": 1 });

export const Workflow = mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
