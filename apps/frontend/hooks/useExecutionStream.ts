"use client";

import { useEffect, useState } from "react";

export type SSEEvent =
  | { event: "connected"; data: { runId: string; status: string } }
  | {
      event: "run:started";
      data: { runId: string; workflowId: string; correlationId: string };
    }
  | {
      event: "node:started";
      data: { nodeId: string; nodeLabel: string; nodeType: string };
    }
  | {
      event: "node:completed";
      data: {
        nodeId: string;
        nodeLabel: string;
        status: string;
        durationMs: number;
      };
    }
  | {
      event: "node:failed";
      data: {
        nodeId: string;
        nodeLabel: string;
        error: string;
        durationMs: number;
      };
    }
  | {
      event: "run:completed";
      data: { runId: string; status: string; durationMs: number };
    }
  | {
      event: "run:failed";
      data: {
        runId: string;
        status: string;
        durationMs: number;
        errorMessage?: string;
      };
    };

export type NodeStreamStatus = {
  nodeId: string;
  nodeLabel: string;
  status: "pending" | "running" | "success" | "failed";
  durationMs?: number;
  error?: string;
};

interface UseExecutionStreamResult {
  nodes: NodeStreamStatus[];
  runStatus: "idle" | "running" | "success" | "failed";
  connected: boolean;
}

export function useExecutionStream(
  runId: string | null,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
): UseExecutionStreamResult {
  const [nodes, setNodes] = useState<NodeStreamStatus[]>([]);
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "success" | "failed"
  >("idle");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!runId) return;

    const token = localStorage.getItem("token");
    const url = `${apiUrl}/executions/${runId}/stream?token=${token}`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);

    es.addEventListener("connected", () => {
      setRunStatus("running");
    });

    es.addEventListener("run:started", () => {
      setRunStatus("running");
    });

    es.addEventListener("node:started", (e) => {
      const data = JSON.parse(e.data);
      setNodes((prev) => {
        const exists = prev.find((n) => n.nodeId === data.nodeId);
        if (exists) {
          return prev.map((n) =>
            n.nodeId === data.nodeId ? { ...n, status: "running" } : n,
          );
        }
        return [
          ...prev,
          { nodeId: data.nodeId, nodeLabel: data.nodeLabel, status: "running" },
        ];
      });
    });

    es.addEventListener("node:completed", (e) => {
      const data = JSON.parse(e.data);
      setNodes((prev) =>
        prev.map((n) =>
          n.nodeId === data.nodeId
            ? { ...n, status: "success", durationMs: data.durationMs }
            : n,
        ),
      );
    });

    es.addEventListener("node:failed", (e) => {
      const data = JSON.parse(e.data);
      setNodes((prev) =>
        prev.map((n) =>
          n.nodeId === data.nodeId
            ? {
                ...n,
                status: "failed",
                durationMs: data.durationMs,
                error: data.error,
              }
            : n,
        ),
      );
    });

    es.addEventListener("run:completed", () => {
      setRunStatus("success");
      es.close();
      setConnected(false);
    });

    es.addEventListener("run:failed", () => {
      setRunStatus("failed");
      es.close();
      setConnected(false);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [runId, apiUrl]);

  return { nodes, runStatus, connected };
}
