"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Loader2,
  ChevronRight,
  Webhook,
  MousePointerClick,
  Zap,
} from "lucide-react";
import api from "@/lib/api";
import StatusBadge from "./StatusBadge";

export interface ExecutionRun {
  _id: string;
  workflowId: { _id: string; name: string } | string;
  correlationId: string;
  status: "running" | "success" | "failed" | "partial" | "cancelled";
  triggeredBy: "webhook" | "manual" | "schedule";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

function TriggerIcon({ triggeredBy }: { triggeredBy: string }) {
  if (triggeredBy === "webhook")
    return <Webhook size={13} className="text-slate-400" />;
  if (triggeredBy === "manual")
    return <MousePointerClick size={13} className="text-slate-400" />;
  return <Zap size={13} className="text-slate-400" />;
}

export default function RunFeed({
  onSelect,
}: {
  onSelect: (run: ExecutionRun) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["executions"],
    queryFn: async () => {
      const { data } = await api.get("/executions?limit=50");
      return data.runs as ExecutionRun[];
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading runs...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-600">No runs yet</h3>
        <p className="text-slate-400 text-sm mt-1">
          Trigger a workflow to see execution history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((run) => {
        const workflowName =
          typeof run.workflowId === "object" ? run.workflowId.name : "Workflow";

        return (
          <button
            key={run._id}
            onClick={() => onSelect(run)}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition-all text-left"
          >
            <StatusBadge status={run.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {workflowName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {run.correlationId}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <TriggerIcon triggeredBy={run.triggeredBy} />
              {run.triggeredBy}
            </div>
            {run.durationMs && (
              <span className="text-xs text-slate-400 shrink-0 w-16 text-right">
                {run.durationMs}ms
              </span>
            )}
            <span className="text-xs text-slate-400 shrink-0 w-24 text-right">
              {formatDistanceToNow(new Date(run.startedAt), {
                addSuffix: true,
              })}
            </span>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
