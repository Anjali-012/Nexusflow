"use client";

import { ReactNode } from "react";
import { useWorkflowStore } from "@/store/workflowStore";

interface NodeCardProps {
  id: string;
  selected?: boolean;
  label: string;
  category: string;
  icon: string;
  accentColor: string; // tailwind border/text color class
  bgColor: string; // tailwind bg class
  children?: ReactNode; // extra content (e.g. url preview)
}

/**
 * NodeCard — shared visual wrapper for all node types.
 * Individual node components (TriggerNode, HttpActionNode etc.)
 * use this for consistent styling.
 */
export default function NodeCard({
  id,
  selected,
  label,
  category,
  icon,
  accentColor,
  bgColor,
  children,
}: NodeCardProps) {
  const selectNode = useWorkflowStore((s) => s.selectNode);

  return (
    <div
      onClick={() => selectNode(id)}
      className={`
        min-w-41.25 px-4 py-3 rounded-xl border-2 cursor-pointer
        shadow-sm transition-all duration-150
        ${bgColor} ${accentColor}
        ${selected ? `ring-2 ring-offset-2 shadow-md` : "hover:shadow-md"}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg select-none">{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
            {category}
          </p>
          <p className="text-sm font-medium leading-tight truncate">{label}</p>
        </div>
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
