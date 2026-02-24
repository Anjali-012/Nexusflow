import { Queue } from "bullmq";

// Pass connection options directly — NOT the ioredis instance
// BullMQ bundles its own ioredis internally, passing an external instance causes type conflicts
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const workflowQueue = new Queue("nexusflow-jobs", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export interface WorkflowJobData {
  workflowId: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  correlationId: string;
  triggeredBy: "webhook" | "manual" | "schedule";
}

export const enqueueWorkflow = async (data: WorkflowJobData) => {
  const job = await workflowQueue.add("run-workflow", data, {
    jobId: data.correlationId,
  });
  return job;
};
