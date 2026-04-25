"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNode, deleteNode } =
    useWorkflowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const subType = selectedNode?.data?.subType as string;

  const [config, setConfig] = useState<Record<string, string>>({});

  // Reset config whenever a different node is selected
  useEffect(() => {
    setConfig(
      selectedNode
        ? (selectedNode.data.config as Record<string, string>) || {}
        : {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  const handleSave = () => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, { config });
    selectNode(null);
  };

  const handleDelete = () => {
    if (!selectedNodeId) return;
    deleteNode(selectedNodeId);
  };

  return (
    <Sheet
      open={!!selectedNodeId}
      onOpenChange={(open) => !open && selectNode(null)}
    >
      <SheetContent className="w-90 sm:w-100">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-6">
            <span>{selectedNode?.data?.label as string}</span>
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete node"
            >
              <Trash2 size={16} />
            </button>
          </SheetTitle>
          <SheetDescription className="text-xs uppercase tracking-wide">
            {selectedNode?.data?.nodeType as string} ·{" "}
            {selectedNode?.data?.subType as string}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-1">
          {subType === "http_request" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  URL
                </label>
                <Input
                  placeholder="https://api.example.com/endpoint"
                  value={config.url || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, url: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Method
                </label>
                <select
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                  value={config.method || "GET"}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, method: e.target.value }))
                  }
                >
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Body (JSON)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono h-24 resize-none"
                  placeholder='{"key": "value"}'
                  value={config.body || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, body: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {subType === "webhook" && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Webhook URL
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-mono text-slate-500 break-all">
                {config.webhookUrl || "Save workflow to generate webhook URL"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Send POST requests to this URL to trigger the workflow.
              </p>
            </div>
          )}

          {subType === "schedule" && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Cron Expression
              </label>
              <Input
                placeholder="0 9 * * 1-5"
                value={config.cron || ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, cron: e.target.value }))
                }
              />
              <p className="text-xs text-slate-400 mt-1">
                Standard cron: minute hour day month weekday
              </p>
            </div>
          )}

          {subType === "if_condition" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Field (JSONPath)
                </label>
                <Input
                  placeholder="$.payload.status"
                  value={config.field || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, field: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Operator
                </label>
                <select
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                  value={config.operator || "eq"}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, operator: e.target.value }))
                  }
                >
                  {["eq", "neq", "gt", "lt", "contains", "regex"].map((op) => (
                    <option key={op}>{op}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Value
                </label>
                <Input
                  placeholder="expected value"
                  value={config.value || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, value: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {subType === "data_mapper" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Source Field
                </label>
                <Input
                  placeholder="$.nodes.node_abc.output.field"
                  value={config.sourceField || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, sourceField: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Target Field
                </label>
                <Input
                  placeholder="outputField"
                  value={config.targetField || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, targetField: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {subType === "delay" && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Delay Duration (ms)
              </label>
              <Input
                type="number"
                placeholder="5000"
                value={config.delayMs || ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, delayMs: e.target.value }))
                }
              />
              <p className="text-xs text-slate-400 mt-1">1000ms = 1 second</p>
            </div>
          )}

          {subType === "ai_copilot" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Instruction
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm h-24 resize-none"
                  placeholder="Analyze the sentiment of {{trigger.message}} and classify it as positive, negative, or neutral."
                  value={config.instruction || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, instruction: e.target.value }))
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  Use {"{{trigger.field}}"} to reference workflow data.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Output Schema (JSON)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono h-24 resize-none"
                  placeholder='{"sentiment": "string", "confidence": "number"}'
                  value={config.outputSchema || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, outputSchema: e.target.value }))
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  Define expected output fields with types: string, number,
                  boolean.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Fallback Value (JSON, optional)
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono h-16 resize-none"
                  placeholder='{"sentiment": "neutral", "confidence": 0}'
                  value={config.fallbackValue || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, fallbackValue: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {subType === "manual" && (
            <p className="text-sm text-slate-400">
              Manual triggers have no configuration. Use the Run Now button to
              trigger this workflow.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-2 px-1">
          <Button className="flex-1" onClick={handleSave}>
            Save Config
          </Button>
          <Button variant="outline" onClick={() => selectNode(null)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
