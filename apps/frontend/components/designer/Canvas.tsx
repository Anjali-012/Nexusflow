"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/store/workflowStore";
import { nodeTypes } from "@/lib/nodeRegistry";
import ConfigPanel from "./ConfigPanel";

/**
 * Canvas — wraps React Flow and connects it directly to the Zustand WorkflowStore.
 * The parent page just needs to render <Canvas /> — no need to pass nodes/edges as props.
 */
export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore();

  return (
    <div className="flex-1 relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode="Delete"
        className="bg-slate-50"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const subType = node.data?.subType as string;
            const colorMap: Record<string, string> = {
              webhook: "#10b981",
              schedule: "#3b82f6",
              manual: "#8b5cf6",
              http_request: "#f97316",
              if_condition: "#a855f7",
              data_mapper: "#06b6d4",
              delay: "#eab308",
            };
            return colorMap[subType] || "#94a3b8";
          }}
          maskColor="rgba(248, 250, 252, 0.7)"
        />
      </ReactFlow>

      {/* Config panel slides in when a node is selected */}
      <ConfigPanel />
    </div>
  );
}
