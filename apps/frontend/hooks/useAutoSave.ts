import { useEffect, useRef } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import api from "@/lib/api";

export function useAutoSave(workflowId: string, enabled = true) {
  const { nodes, edges, serializeDAG } = useWorkflowStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip auto-save on the initial load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled || !workflowId) return;

    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Debounce: wait 500ms after last change before saving
    timerRef.current = setTimeout(async () => {
      try {
        const payload = serializeDAG();
        await api.patch(`/workflows/${workflowId}`, payload);
        console.log("[AutoSave] Workflow saved");
      } catch (err) {
        console.error("[AutoSave] Failed to save workflow", err);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflowId, enabled]);
}
