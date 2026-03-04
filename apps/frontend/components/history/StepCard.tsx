"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import JsonViewer from "./JsonViewer";

export interface ExecutionStep {
  _id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: "success" | "failed" | "skipped";
  startedAt: string;
  durationMs: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorDetails?: {
    message: string;
    stack?: string;
    retryCount: number;
  };
}

function StepStatusIcon({ status }: { status: ExecutionStep["status"] }) {
  if (status === "success")
    return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
  if (status === "failed")
    return <XCircle size={16} className="text-red-500 shrink-0" />;
  return <Clock size={16} className="text-slate-400 shrink-0" />;
}

export default function StepCard({
  step,
  index,
}: {
  step: ExecutionStep;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-xs text-slate-400 font-mono w-5 shrink-0">
          {index}
        </span>
        <StepStatusIcon status={step.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {step.nodeLabel}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">
            {step.nodeType} · {step.durationMs}ms
          </p>
        </div>
        <ChevronRight
          size={14}
          className={`text-slate-400 transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50">
          {step.inputData && Object.keys(step.inputData).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Input
              </p>
              <JsonViewer data={step.inputData} />
            </div>
          )}
          {step.outputData && Object.keys(step.outputData).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Output
              </p>
              <JsonViewer data={step.outputData} />
            </div>
          )}
          {step.errorDetails?.message && (
            <div>
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-1">
                Error
              </p>
              <pre className="bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-md p-3 overflow-auto font-mono">
                {step.errorDetails.message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
