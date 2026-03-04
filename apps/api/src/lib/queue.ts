import { Queue } from "bullmq";
import { WorkflowJobData, RetryPolicy, DEFAULT_RETRY_POLICY } from "./types";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const QUEUE_NAME = "nexusflow-jobs";

export const workflowQueue = new Queue<WorkflowJobData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: DEFAULT_RETRY_POLICY.maxRetries + 1,
    backoff: {
      type: "exponential",
      delay: DEFAULT_RETRY_POLICY.baseDelayMs,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const enqueueWorkflow = async (
  data: WorkflowJobData,
  retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
) => {
  return workflowQueue.add("run-workflow", data, {
    jobId: data.correlationId,
    attempts: retryPolicy.maxRetries + 1,
    backoff: {
      type: "exponential",
      delay: retryPolicy.baseDelayMs,
    },
  });
};

export { WorkflowJobData, RetryPolicy };
