import { create } from "zustand";
import {
  Node,
  Edge,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { nanoid } from "nanoid";

export type NodeType = "trigger" | "action" | "logic_gate" | "transformer";
export type NodeSubType =
  | "webhook"
  | "schedule"
  | "manual"
  | "http_request"
  | "if_condition"
  | "data_mapper"
  | "delay";

export type WorkflowNodeData = {
  label: string;
  nodeType: NodeType;
  subType: NodeSubType;
  config: Record<string, unknown>;
};

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

interface WorkflowMeta {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  meta: WorkflowMeta | null;
  selectedNodeId: string | null;

  setMeta: (meta: WorkflowMeta) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addNode: (nodeType: NodeType, subType: NodeSubType) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (nodeId: string | null) => void;
  serializeDAG: () => {
    nodes: Array<{
      id: string;
      nodeType: NodeType;
      subType: NodeSubType;
      label: string;
      position: { x: number; y: number };
      config: Record<string, unknown>;
    }>;
    edges: Array<{
      id: string;
      sourceNodeId: string;
      targetNodeId: string;
      sourcePort: string;
      targetPort: string;
    }>;
  };
  loadFromAPI: (apiNodes: unknown[], apiEdges: unknown[]) => void;
  reset: () => void;
}

const NODE_LABELS: Record<NodeSubType, string> = {
  webhook: "Webhook Trigger",
  schedule: "Schedule Trigger",
  manual: "Manual Trigger",
  http_request: "HTTP Request",
  if_condition: "If Condition",
  data_mapper: "Data Transformer",
  delay: "Delay",
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  meta: null,
  selectedNodeId: null,

  setMeta: (meta) => set({ meta }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  addNode: (nodeType, subType) => {
    const id = `node-${nanoid(8)}`;
    const newNode: WorkflowNode = {
      id,
      type: subType, // maps to nodeRegistry key
      position: {
        x: Math.random() * 300 + 150,
        y: Math.random() * 200 + 100,
      },
      data: {
        label: NODE_LABELS[subType] || "New Node",
        nodeType,
        subType,
        config: {},
      },
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, id: `edge-${nanoid(8)}` }, state.edges),
    }));
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  serializeDAG: () => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        nodeType: n.data.nodeType,
        subType: n.data.subType,
        label: n.data.label,
        position: n.position,
        config: n.data.config || {},
      })),
      edges: edges.map((e) => ({
        id: e.id || `edge-${nanoid(8)}`,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourcePort: e.sourceHandle || "output",
        targetPort: e.targetHandle || "input",
      })),
    };
  },

  loadFromAPI: (apiNodes, apiEdges) => {
    const nodes = (
      apiNodes as Array<{
        id: string;
        nodeType: NodeType;
        subType: NodeSubType;
        label: string;
        position: { x: number; y: number };
        config: Record<string, unknown>;
      }>
    ).map((n) => ({
      id: n.id,
      type: n.subType,
      position: n.position,
      data: {
        label: n.label,
        nodeType: n.nodeType,
        subType: n.subType,
        config: n.config || {},
      },
    }));

    const edges = (
      apiEdges as Array<{
        id: string;
        sourceNodeId: string;
        targetNodeId: string;
        sourcePort: string;
        targetPort: string;
      }>
    ).map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourcePort,
      targetHandle: e.targetPort,
    }));

    set({ nodes, edges });
  },

  reset: () => set({ nodes: [], edges: [], meta: null, selectedNodeId: null }),
}));
