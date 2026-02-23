import { NodeTypes } from "@xyflow/react";
import TriggerNode from "@/components/designer/nodes/TriggerNode";
import HttpActionNode from "@/components/designer/nodes/HttpActionNode";
import IfConditionNode from "@/components/designer/nodes/IfConditionNode";
import TransformNode from "@/components/designer/nodes/TransformNode";

export const nodeTypes: NodeTypes = {
  webhook: TriggerNode,
  schedule: TriggerNode,
  manual: TriggerNode,
  http_request: HttpActionNode,
  delay: HttpActionNode,
  if_condition: IfConditionNode,
  data_mapper: TransformNode,
};

export type NodeCategory = {
  label: string;
  nodes: Array<{
    subType: string;
    label: string;
    nodeType: "trigger" | "action" | "logic_gate" | "transformer";
    description: string;
  }>;
};

export const NODE_PALETTE: NodeCategory[] = [
  {
    label: "Triggers",
    nodes: [
      {
        subType: "webhook",
        label: "Webhook",
        nodeType: "trigger",
        description: "Start workflow from HTTP POST",
      },
      {
        subType: "schedule",
        label: "Schedule",
        nodeType: "trigger",
        description: "Run on a cron schedule",
      },
      {
        subType: "manual",
        label: "Manual",
        nodeType: "trigger",
        description: "Trigger manually from UI",
      },
    ],
  },
  {
    label: "Actions",
    nodes: [
      {
        subType: "http_request",
        label: "HTTP Request",
        nodeType: "action",
        description: "Make an HTTP call",
      },
      {
        subType: "delay",
        label: "Delay",
        nodeType: "action",
        description: "Wait before continuing",
      },
    ],
  },
  {
    label: "Logic",
    nodes: [
      {
        subType: "if_condition",
        label: "If / Else",
        nodeType: "logic_gate",
        description: "Branch based on condition",
      },
    ],
  },
  {
    label: "Transform",
    nodes: [
      {
        subType: "data_mapper",
        label: "Transform",
        nodeType: "transformer",
        description: "Reshape data between nodes",
      },
    ],
  },
];
