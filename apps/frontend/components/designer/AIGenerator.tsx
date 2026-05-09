"use client";

import { useState } from "react";
import { X, Loader2, Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface GeneratedWorkflow {
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    nodeType: "trigger" | "action" | "logic_gate" | "transformer";
    subType: string;
    label: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort: string;
    targetPort: string;
  }>;
  trigger: {
    type: "webhook" | "schedule" | "manual";
    config: Record<string, unknown>;
  };
}

const EXAMPLES = [
  "Every day at 9am fetch Bitcoin price and send a POST request if it dropped 10%",
  "When a webhook fires, check if payload amount is over 1000 then call an API",
  "Every hour make an HTTP request and transform the response data",
];

export default function AIGenerator({
  onGenerated,
  onClose,
}: {
  onGenerated: (workflow: GeneratedWorkflow) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate", { prompt });
      onGenerated(data.workflow);
      toast.success("Workflow generated!");
      setPrompt("");
    } catch {
      toast.error("Failed to generate workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <Wand2 size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                AI Workflow Generator
              </h2>
              <p className="text-[11px] text-slate-400">
                Describe your automation in plain English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all text-slate-800 placeholder:text-slate-400"
            placeholder="e.g. Every day at 9am fetch Bitcoin price, if dropped 10% send a POST to my webhook..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleGenerate();
            }}
          />

          {/* Examples */}
          <div className="mt-3 mb-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
              Examples
            </p>
            <div className="flex flex-col gap-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-left text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-slate-200"
                >
                  <span className="text-slate-300 mr-1.5">→</span>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="mr-1.5" />
                  Generate Workflow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-2.5">
            Press <kbd className="bg-slate-100 px-1 rounded text-[10px]">⌘</kbd>{" "}
            + <kbd className="bg-slate-100 px-1 rounded text-[10px]">Enter</kbd>{" "}
            to generate
          </p>
        </div>
      </div>
    </div>
  );
}
