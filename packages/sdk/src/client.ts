export interface NexusFlowConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  correlationId: string;
  status: "running" | "success" | "failed" | "partial" | "cancelled";
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
}

export class NexusFlowClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NexusFlowConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "http://localhost:3001";
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  workflows = {
    trigger: async (
      workflowId: string,
      options: {
        payload?: Record<string, unknown>;
        idempotencyKey?: string;
      } = {},
    ): Promise<{ correlationId: string; message: string }> => {
      const headers: Record<string, string> = {};
      if (options.idempotencyKey) {
        headers["x-idempotency-key"] = options.idempotencyKey;
      }

      return this.fetch(`/webhooks/manual/${workflowId}`, {
        method: "POST",
        body: JSON.stringify(options.payload || {}),
        headers,
      });
    },
  };

  executions = {
    get: async (runId: string): Promise<{ run: WorkflowRun }> => {
      return this.fetch(`/executions/${runId}`);
    },

    list: async (
      workflowId: string,
      options: { status?: string; limit?: number } = {},
    ): Promise<{ runs: WorkflowRun[] }> => {
      const params = new URLSearchParams({ workflowId });
      if (options.status) params.set("status", options.status);
      if (options.limit) params.set("limit", String(options.limit));
      return this.fetch(`/executions?${params.toString()}`);
    },

    steps: async (runId: string): Promise<{ steps: ExecutionStep[] }> => {
      return this.fetch(`/executions/${runId}/steps`);
    },

    waitForCompletion: async (
      runId: string,
      options: { timeoutMs?: number; pollIntervalMs?: number } = {},
    ): Promise<WorkflowRun> => {
      const { timeoutMs = 30000, pollIntervalMs = 500 } = options;
      const deadline = Date.now() + timeoutMs;
      let delay = pollIntervalMs;

      while (Date.now() < deadline) {
        const { run } = await this.executions.get(runId);
        if (run.status !== "running") return run;

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 4000); // exponential backoff capped at 4s
      }

      throw new Error(
        `Execution ${runId} did not complete within ${timeoutMs}ms`,
      );
    },

    replay: async (runId: string): Promise<{ correlationId: string }> => {
      return this.fetch(`/executions/${runId}/replay`, { method: "POST" });
    },
  };
}
