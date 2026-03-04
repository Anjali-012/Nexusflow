import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import { runDAG } from "./runner/dagRunner";
import { WorkflowJobData } from "./lib/types";
import { redisConnection, deadLetterQueue, QUEUE_NAME } from "./lib/queue";

dotenv.config();

async function processJob(job: Job<WorkflowJobData>): Promise<void> {
  const attempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts ?? 4;

  console.log(`\n📦 Job received: ${job.id}`);
  console.log(`   Workflow:     ${job.data.workflowId}`);
  console.log(`   Triggered by: ${job.data.triggeredBy}`);
  console.log(`   Correlation:  ${job.data.correlationId}`);
  console.log(`   Attempt:      ${attempt}/${maxAttempts}`);

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
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const attempt = job.attemptsMade;
    const maxAttempts = job.opts.attempts ?? 4;
    const isLastAttempt = attempt >= maxAttempts;

    if (isLastAttempt) {
      console.error(`💀 Job exhausted all retries: ${job.id} — sending to DLQ`);
      await deadLetterQueue.add("dead-letter", job.data, {
        jobId: `dlq-${job.id}`,
      });
    } else {
      console.warn(
        `⚠️  Job failed (attempt ${attempt}/${maxAttempts}): ${job.id} — ${err.message}`,
      );
    }
  });

  worker.on("stalled", (jobId) => {
    console.warn(`⏸️  Job stalled: ${jobId}`);
  });

  worker.on("error", (err) => {
    console.error("🔥 Worker error:", err.message);
  });
}

const start = async () => {
  await connectDB();

  console.log(`✅ NexusFlow Worker started — watching queue: ${QUEUE_NAME}`);

  const worker = new Worker<WorkflowJobData>(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 5,
  });

  attachWorkerEvents(worker);

  process.on("SIGTERM", async () => {
    console.log("🛑 SIGTERM received — closing worker gracefully...");
    await worker.close();
    process.exit(0);
  });
};

start();
