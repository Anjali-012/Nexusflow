import { Worker, ConnectionOptions } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const connection: ConnectionOptions = {
  host: "localhost",
  port: 6379,
};

console.log("✅ NexusFlow Worker started — watching queues...");

const worker = new Worker(
  "nexusflow-default",
  async (job) => {
    console.log(`📦 Processing job: ${job.id}`, job.data);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job?.id}`, err);
});
