import { Queue, QueueEvents } from "bullmq";
import { WorkflowJobData } from "./types";

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
