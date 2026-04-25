import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import { runDAG } from "./runner/dagRunner";
import { WorkflowJobData } from "./lib/types";
import { redisConnection, deadLetterQueue, QUEUE_NAME } from "./lib/queue";
import logger from "./lib/logger";
import { startScheduler } from "./scheduler";

dotenv.config();

async function processJob(job: Job<WorkflowJobData>): Promise<void> {
  const attempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts ?? 4;

  logger.info("Job received", {
    jobId: job.id,
    workflowId: job.data.workflowId,
    triggeredBy: job.data.triggeredBy,
    correlationId: job.data.correlationId,
    attempt: `${attempt}/${maxAttempts}`,
  });

  await runDAG(
    job.data.workflowId,
    job.data.tenantId,
    job.data.correlationId,
    job.data.triggerPayload,
    job.data.triggeredBy,
  );
}

function attachWorkerEvents(worker: Worker<WorkflowJobData>): void {
  worker.on("completed", (job) => {
    logger.info("Job completed", { jobId: job.id });
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const attempt = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 4;
    const isLastAttempt = attempt >= maxAttempts;

    if (isLastAttempt) {
      logger.error("Job exhausted all retries — sending to DLQ", {
        jobId: job.id,
        error: err.message,
      });
      await deadLetterQueue.add("dead-letter", job.data, {
        jobId: `dlq-${job.id}`,
      });
    } else {
      logger.warn("Job failed — will retry", {
        jobId: job.id,
        attempt: `${attempt}/${maxAttempts}`,
        error: err.message,
      });
    }
  });

  worker.on("stalled", (jobId) => {
    logger.warn("Job stalled", { jobId });
  });

  worker.on("error", (err) => {
    logger.error("Worker error", { error: err.message });
  });
}

const start = async () => {
  await connectDB();
  await startScheduler();
  logger.info(`NexusFlow Worker started`, { queue: QUEUE_NAME });

  const worker = new Worker<WorkflowJobData>(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 5,
  });

  attachWorkerEvents(worker);

  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received — closing worker gracefully");
    await worker.close();
    process.exit(0);
  });
};

start();
