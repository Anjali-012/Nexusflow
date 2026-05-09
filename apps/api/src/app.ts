import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import workflowRoutes from "./routes/workflow.routes";
import webhookRoutes from "./routes/webhook.routes";
import executionRoutes from "./routes/execution.routes";
import streamRoutes from "./routes/stream.routes";
import credentialRoutes from "./routes/credential.routes";
import { webhookRateLimiter, authRateLimiter } from "./middleware/rateLimiter";
import metricsRouter from "./routes/metrics.routes";
import apiKeyRoutes from "./routes/apiKey.routes";
import { apiKeyAuth } from "./middleware/apiKeyAuth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { workflowQueue } from "./lib/queue";
import aiRoutes from "./routes/ai.routes";
import { metricsMiddleware } from "./middleware/metrics.middleware";

const app = express();

const isTest = process.env.NODE_ENV === "test";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(workflowQueue)],
  serverAdapter,
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexusflow-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use(apiKeyAuth);
app.use("/admin/queues", serverAdapter.getRouter());

app.use("/auth", ...(isTest ? [] : [authRateLimiter]), authRoutes);
app.use("/workflows", workflowRoutes);
app.use("/webhooks", ...(isTest ? [] : [webhookRateLimiter]), webhookRoutes);
app.use("/executions", executionRoutes);
app.use("/executions", streamRoutes);
app.use("/credentials", credentialRoutes);
app.use(metricsMiddleware);
app.use("/metrics", metricsRouter);
app.use("/api-keys", apiKeyRoutes);
app.use("/ai", aiRoutes);

export default app;
