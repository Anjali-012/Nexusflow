"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";
import { Webhook, Clock, MousePointerClick } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  webhook: <Webhook size={14} />,
  schedule: <Clock size={14} />,
  manual: <MousePointerClick size={14} />,
};

const COLORS: Record<string, string> = {
  webhook: "bg-emerald-50 border-emerald-300 text-emerald-800",
  schedule: "bg-blue-50 border-blue-300 text-blue-800",
  manual: "bg-violet-50 border-violet-300 text-violet-800",
};

const RING: Record<string, string> = {
  webhook: "ring-emerald-400",
  schedule: "ring-blue-400",
  manual: "ring-violet-400",
};

export default function TriggerNode({ id, data, selected }: NodeProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const subType = data?.subType as string;
  const label = data?.label as string;

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-[160px] px-3 py-2.5 rounded-lg border cursor-pointer
        shadow-sm transition-all duration-150
        ${COLORS[subType] || "bg-gray-50 border-gray-300 text-gray-800"}
        ${selected ? `ring-2 ring-offset-1 shadow-md ${RING[subType] || "ring-gray-400"}` : "hover:shadow-md"}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="shrink-0 opacity-70">{ICONS[subType]}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 leading-tight">
            Trigger
          </p>
          <p className="text-xs font-semibold leading-tight truncate">
            {label}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{
          background: "#10b981",
          width: 10,
          height: 10,
          border: "2px solid white",
        }}
      />
    </div>
  );
}
