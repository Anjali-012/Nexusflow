import { Queue, QueueEvents } from "bullmq";
import { WorkflowJobData, DEFAULT_RETRY_POLICY } from "./types";

export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const QUEUE_NAME = "nexusflow-jobs";
export const DLQ_NAME = "nexusflow-jobs-dlq";

export const deadLetterQueue = new Queue<WorkflowJobData>(DLQ_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

export const workflowQueue = new Queue<WorkflowJobData>(QUEUE_NAME, {
  connection: redisConnection,
});

export const enqueueWorkflow = async (data: WorkflowJobData) => {
  return workflowQueue.add("run-workflow", data, {
    jobId: data.correlationId,
    attempts: DEFAULT_RETRY_POLICY.maxRetries + 1,
    backoff: {
      type: "exponential",
      delay: DEFAULT_RETRY_POLICY.baseDelayMs,
    },
  });
};
