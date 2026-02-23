"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { Shuffle } from "lucide-react";

export default function TransformNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const label = data?.label as string;
  const config = data?.config as {
    mappings?: Array<{ source: string; target: string }>;
  };

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-[160px] px-3 py-2.5 rounded-lg border cursor-pointer
        shadow-sm transition-all duration-150
        bg-cyan-50 border-cyan-300 text-cyan-800
        ${selected ? "ring-2 ring-offset-1 ring-cyan-400 shadow-md" : "hover:shadow-md"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          background: "#94a3b8",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />

      <div className="flex items-center gap-2">
        <div className="shrink-0 opacity-70">
          <Shuffle size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 leading-tight">
            Transform
          </p>
          <p className="text-xs font-semibold leading-tight truncate">
            {label}
          </p>
        </div>
      </div>

      {config?.mappings && config.mappings.length > 0 && (
        <p className="mt-1.5 text-[10px] opacity-50">
          {config.mappings.length} mapping
          {config.mappings.length > 1 ? "s" : ""}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{
          background: "#06b6d4",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
    </div>
  );
}
