"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import {
  useExecutionStream,
  NodeStreamStatus,
} from "@/hooks/useExecutionStream";
import api from "@/lib/api";

function NodeRow({ node }: { node: NodeStreamStatus }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {node.status === "running" && (
        <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
      )}
      {node.status === "success" && (
        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      )}
      {node.status === "failed" && (
        <XCircle size={14} className="text-red-500 shrink-0" />
      )}
      {node.status === "pending" && (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
      )}
      <span className="text-xs text-slate-700 flex-1 truncate">
        {node.nodeLabel}
      </span>
      {node.durationMs !== undefined && (
        <span className="text-[10px] text-slate-400">{node.durationMs}ms</span>
      )}
    </div>
  );
}

const RUN_STATUS_STYLES: Record<string, string> = {
  idle: "border-slate-200",
  running: "border-blue-200 bg-blue-50",
  success: "border-emerald-200 bg-emerald-50",
  failed: "border-red-200 bg-red-50",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  idle: "Execution",
  running: "Running...",
  success: "Completed",
  failed: "Failed",
};

export default function ExecutionPanel({
  runId,
  onClose,
}: {
  runId: string;
  onClose: () => void;
}) {
  const { nodes, runStatus } = useExecutionStream(runId);
  const [fallbackNodes, setFallbackNodes] = useState<NodeStreamStatus[]>([]);
  const [fallbackStatus, setFallbackStatus] = useState<
    "success" | "failed" | null
  >(null);

  useEffect(() => {
    if (!runId) return;

    const fetchFallback = async () => {
      try {
        const [stepsRes, runRes] = await Promise.all([
          api.get(`/executions/${runId}/steps`),
          api.get(`/executions/${runId}`),
        ]);

        const mapped: NodeStreamStatus[] = stepsRes.data.steps.map(
          (s: {
            nodeId: string;
            nodeLabel: string;
            status: "success" | "failed" | "skipped";
            durationMs: number;
            errorDetails?: { message: string };
          }) => ({
            nodeId: s.nodeId,
            nodeLabel: s.nodeLabel,
            status: s.status === "skipped" ? "pending" : s.status,
            durationMs: s.durationMs,
            error: s.errorDetails?.message,
          }),
        );

        setFallbackNodes(mapped);
        setFallbackStatus(
          runRes.data.run.status === "failed" ? "failed" : "success",
        );
      } catch {
        // silently fail
      }
    };

    // Small delay to give SSE a chance first
    const timer = setTimeout(fetchFallback, 800);
    return () => clearTimeout(timer);
  }, [runId]);

  const displayNodes = nodes.length > 0 ? nodes : fallbackNodes;
  const displayStatus =
    runStatus !== "idle" ? runStatus : (fallbackStatus ?? "idle");

  return (
    <div
      className={`absolute bottom-28 right-4 w-64 rounded-xl border shadow-lg bg-white overflow-hidden z-20 ${RUN_STATUS_STYLES[displayStatus]}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {displayStatus === "running" && (
            <Loader2 size={13} className="animate-spin text-blue-500" />
          )}
          {displayStatus === "success" && (
            <CheckCircle2 size={13} className="text-emerald-500" />
          )}
          {displayStatus === "failed" && (
            <XCircle size={13} className="text-red-500" />
          )}
          <p className="text-xs font-semibold text-slate-700">
            {RUN_STATUS_LABELS[displayStatus] || "Execution"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={13} />
        </button>
      </div>

      <div className="px-3 py-2 max-h-48 overflow-y-auto">
        {displayNodes.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 size={13} className="animate-spin text-slate-400" />
            <p className="text-xs text-slate-400">Loading...</p>
          </div>
        ) : (
          displayNodes.map((node) => <NodeRow key={node.nodeId} node={node} />)
        )}
      </div>
    </div>
  );
}
