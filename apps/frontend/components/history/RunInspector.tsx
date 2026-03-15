"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import StatusBadge from "./StatusBadge";
import StepCard, { ExecutionStep } from "./StepCard";
import { ExecutionRun } from "./RunFeed";

export default function RunInspector({
  run,
  onBack,
}: {
  run: ExecutionRun;
  onBack: () => void;
}) {
  const [replaying, setReplaying] = useState(false);

  const { data: steps, isLoading } = useQuery({
    queryKey: ["steps", run._id],
    queryFn: async () => {
      const { data } = await api.get(`/executions/${run._id}/steps`);
      return data.steps as ExecutionStep[];
    },
  });

  const handleReplay = async () => {
    setReplaying(true);
    try {
      await api.post(`/executions/${run._id}/replay`);
      toast.success("Replay enqueued — check History in a moment");
    } catch {
      toast.error("Failed to replay execution");
    } finally {
      setReplaying(false);
    }
  };

  const workflowName =
    typeof run.workflowId === "object" ? run.workflowId.name : "Workflow";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {workflowName}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {run.correlationId}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={run.status} />
          {run.durationMs && (
            <span className="text-xs text-slate-400">{run.durationMs}ms</span>
          )}
          <button
            onClick={handleReplay}
            disabled={replaying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            {replaying ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RotateCcw size={13} />
            )}
            {replaying ? "Replaying..." : "Replay"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Started",
            value: format(new Date(run.startedAt), "MMM d, HH:mm:ss"),
          },
          { label: "Triggered by", value: run.triggeredBy },
          {
            label: "Duration",
            value: run.durationMs ? `${run.durationMs}ms` : "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg border border-slate-200 px-4 py-3"
          >
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {run.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
          <p className="text-sm text-red-600">{run.errorMessage}</p>
        </div>
      )}

      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Execution Steps
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-8">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading steps...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {steps?.map((step, i) => (
            <StepCard key={step._id} step={step} index={i + 1} />
          ))}
          {steps?.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">
              No steps recorded
            </p>
          )}
        </div>
      )}
    </div>
  );
}
