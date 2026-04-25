"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Play,
  Webhook,
  Clock,
  MousePointerClick,
  Zap,
  GitBranch,
  Shuffle,
  Timer,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useWorkflowStore, NodeType, NodeSubType } from "@/store/workflowStore";
import { NODE_PALETTE } from "@/lib/nodeRegistry";
import Canvas from "@/components/designer/Canvas";
import { useAutoSave } from "@/hooks/useAutoSave";
import ExecutionPanel from "@/components/designer/ExecutionPanel";
import { useCollaboration } from "@/hooks/useCollaboration";
import CollaboratorPresence from "@/components/designer/CollaboratorPresence";

const SUBTYPE_ICONS: Record<string, React.ReactNode> = {
  webhook: <Webhook size={14} />,
  schedule: <Clock size={14} />,
  manual: <MousePointerClick size={14} />,
  http_request: <Zap size={14} />,
  if_condition: <GitBranch size={14} />,
  data_mapper: <Shuffle size={14} />,
  delay: <Timer size={14} />,
  ai_copilot: <Zap size={14} />,
};

const SUBTYPE_COLORS: Record<string, string> = {
  webhook: "text-emerald-600 bg-emerald-50 border-emerald-200",
  schedule: "text-blue-600 bg-blue-50 border-blue-200",
  manual: "text-violet-600 bg-violet-50 border-violet-200",
  http_request: "text-orange-600 bg-orange-50 border-orange-200",
  if_condition: "text-purple-600 bg-purple-50 border-purple-200",
  data_mapper: "text-cyan-600 bg-cyan-50 border-cyan-200",
  delay: "text-yellow-600 bg-yellow-50 border-yellow-200",
  ai_copilot: "text-pink-600 bg-pink-50 border-pink-200",
};

function NodePalette({
  onAdd,
}: {
  onAdd: (type: NodeType, sub: NodeSubType) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (label: string) =>
    setCollapsed((c) => ({ ...c, [label]: !c[label] }));

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Node Library
        </p>
      </div>
      <div className="flex-1 py-2">
        {NODE_PALETTE.map((category) => (
          <div key={category.label} className="mb-1">
            <button
              onClick={() => toggle(category.label)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
            >
              <span>{category.label}</span>
              {collapsed[category.label] ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
            {!collapsed[category.label] && (
              <div className="px-2 pb-1 space-y-0.5">
                {category.nodes.map((node) => (
                  <button
                    key={node.subType}
                    onClick={() =>
                      onAdd(
                        node.nodeType as NodeType,
                        node.subType as NodeSubType,
                      )
                    }
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-left transition-all duration-100 hover:shadow-sm active:scale-[0.98] ${SUBTYPE_COLORS[node.subType] || "text-slate-600 bg-slate-50 border-slate-200"}`}
                  >
                    <span className="shrink-0">
                      {SUBTYPE_ICONS[node.subType]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight">
                        {node.label}
                      </p>
                      <p className="text-[10px] opacity-60 leading-tight truncate">
                        {node.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Click a node to add it to the canvas. Drag to reposition. Press{" "}
          <kbd className="bg-slate-100 px-1 rounded text-[10px]">Del</kbd> to
          remove selected.
        </p>
      </div>
    </aside>
  );
}

export default function DesignerPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.workflowId as string;

  const { addNode, serializeDAG, loadFromAPI, setMeta, meta } =
    useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const { collaborators, connected } = useCollaboration(workflowId);

  useAutoSave(workflowId);

  useEffect(() => {
    fetchWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const { data } = await api.get(`/workflows/${workflowId}`);
      setMeta({
        id: data.workflow._id,
        name: data.workflow.name,
        status: data.workflow.status,
      });
      if (data.workflow.nodes?.length > 0 || data.workflow.edges?.length > 0) {
        loadFromAPI(data.workflow.nodes || [], data.workflow.edges || []);
      }
    } catch {
      toast.error("Failed to load workflow");
    }
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const payload = serializeDAG();
      await api.patch(`/workflows/${workflowId}`, payload);
      toast.success("Workflow saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const triggerWorkflow = async () => {
    setTriggering(true);
    try {
      const { data } = await api.post(`/webhooks/manual/${workflowId}`, {});

      const correlationId = data.correlationId;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const runsRes = await api.get(
          `/executions?workflowId=${workflowId}&limit=1`,
        );
        const latestRun = runsRes.data.runs?.[0];
        if (latestRun?.correlationId === correlationId || attempts > 10) {
          clearInterval(poll);
          if (latestRun) setActiveRunId(latestRun._id);
          // Show toast after panel appears
          setTimeout(() => toast.success("Workflow completed!"), 1000);
        }
      }, 200);
    } catch {
      toast.error("Failed to trigger workflow");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-10">
        <CollaboratorPresence
          collaborators={collaborators}
          connected={connected}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">
              {meta?.name || "Loading..."}
            </h2>
            <p className="text-xs text-slate-400 capitalize leading-tight">
              {meta?.status || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerWorkflow}
            disabled={triggering}
            className="h-8 text-xs"
          >
            <Play size={13} className="mr-1.5" />
            {triggering ? "Running..." : "Run Now"}
          </Button>
          <Button
            size="sm"
            onClick={saveWorkflow}
            disabled={saving}
            className="h-8 text-xs"
          >
            <Save size={13} className="mr-1.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette onAdd={addNode} />
        <main className="flex-1 overflow-hidden relative">
          <Canvas />
          {activeRunId && (
            <ExecutionPanel
              runId={activeRunId}
              onClose={() => setActiveRunId(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
