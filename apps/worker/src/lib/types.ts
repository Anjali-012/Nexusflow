export interface WorkflowJobData {
  workflowId: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  correlationId: string;
  triggeredBy: "webhook" | "manual" | "schedule";
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 1000,
  backoffMultiplier: 2,
};
