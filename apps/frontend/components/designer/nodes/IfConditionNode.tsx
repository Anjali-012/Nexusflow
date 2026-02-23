"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { GitBranch } from "lucide-react";

export default function IfConditionNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const label = data?.label as string;

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-[160px] px-3 py-2.5 rounded-lg border cursor-pointer
        shadow-sm transition-all duration-150
        bg-purple-50 border-purple-300 text-purple-800
        ${selected ? "ring-2 ring-offset-1 ring-purple-400 shadow-md" : "hover:shadow-md"}
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
          <GitBranch size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 leading-tight">
            Logic Gate
          </p>
          <p className="text-xs font-semibold leading-tight truncate">
            {label}
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-2 px-0.5">
        <span className="text-[10px] font-semibold text-emerald-600">TRUE</span>
        <span className="text-[10px] font-semibold text-red-500">FALSE</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true_branch"
        style={{
          left: "30%",
          background: "#10b981",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false_branch"
        style={{
          left: "70%",
          background: "#f87171",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
    </div>
  );
}
