// Shared job data type — used by both API producer and Worker consumer
export interface WorkflowJobData {
  workflowId: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  correlationId: string;
  triggeredBy: "webhook" | "manual" | "schedule";
}
