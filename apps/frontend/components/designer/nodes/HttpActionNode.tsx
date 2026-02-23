"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";

export default function HttpActionNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);

  const label = data?.label as string;
  const subType = data?.subType as string;
  const config = data?.config as Record<string, string>;

  const colorMap: Record<string, string> = {
    http_request: "bg-orange-50 border-orange-400 text-orange-800",
    delay: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };

  const colors =
    colorMap[subType] || "bg-orange-50 border-orange-400 text-orange-800";

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-40 px-4 py-3 rounded-xl border-2 cursor-pointer
        shadow-sm transition-all duration-150
        ${colors}
        ${selected ? "ring-2 ring-offset-2 ring-orange-400 shadow-md" : "hover:shadow-md"}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="bg-slate-400! w-3! h-3! border-2! border-white!"
      />

      <div className="flex items-center gap-2">
        <span className="text-lg">{label?.split(" ")[0]}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
            Action
          </p>
          <p className="text-sm font-medium leading-tight">
            {label?.split(" ").slice(1).join(" ")}
          </p>
        </div>
      </div>

      {/* Show configured URL if set */}
      {config?.url && (
        <p className="mt-1 text-xs opacity-50 truncate max-w-35">
          {config.method || "GET"} {config.url}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="bg-orange-500! w-3! h-3! border-2! border-white!"
      />
    </div>
  );
}
