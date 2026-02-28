import { Worker } from "bullmq";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import { runDAG } from "./runner/dagRunner";
import { WorkflowJobData } from "./lib/queue";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

const start = async () => {
  // Connect to MongoDB first — DAG runner needs it
  await connectDB();

  console.log("✅ NexusFlow Worker started — watching queue: nexusflow-jobs");

  const worker = new Worker<WorkflowJobData>(
    "nexusflow-jobs", // must match queue name in api/src/lib/queue.ts
    async (job) => {
      console.log(`\n📦 Job received: ${job.id}`);
      console.log(`   Workflow: ${job.data.workflowId}`);
      console.log(`   Triggered by: ${job.data.triggeredBy}`);
      console.log(`   Correlation: ${job.data.correlationId}`);

      await runDAG(
        job.data.workflowId,
        job.data.tenantId,
        job.data.correlationId,
        job.data.triggerPayload,
        job.data.triggeredBy,
      );
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job failed: ${job?.id}`, err.message);
  });
};

start();
