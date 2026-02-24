"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { Zap, Timer } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  http_request: <Zap size={14} />,
  delay: <Timer size={14} />,
};

const COLORS: Record<string, string> = {
  http_request: "bg-orange-50 border-orange-300 text-orange-800",
  delay: "bg-yellow-50 border-yellow-300 text-yellow-800",
};

const RING: Record<string, string> = {
  http_request: "ring-orange-400",
  delay: "ring-yellow-400",
};

export default function HttpActionNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const subType = data?.subType as string;
  const label = data?.label as string;
  const config = data?.config as Record<string, string>;

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-[160px] px-3 py-2.5 rounded-lg border cursor-pointer
        shadow-sm transition-all duration-150
        ${COLORS[subType] || "bg-orange-50 border-orange-300 text-orange-800"}
        ${selected ? `ring-2 ring-offset-1 shadow-md ${RING[subType] || "ring-orange-400"}` : "hover:shadow-md"}
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
        <div className="shrink-0 opacity-70">{ICONS[subType]}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 leading-tight">
            Action
          </p>
          <p className="text-xs font-semibold leading-tight truncate">
            {label}
          </p>
        </div>
      </div>

      {config?.url && (
        <p className="mt-1.5 text-[10px] opacity-50 truncate font-mono">
          {config.method || "GET"} {config.url}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{
          background: "#f97316",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
    </div>
  );
}
