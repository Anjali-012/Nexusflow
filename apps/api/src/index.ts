import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import authRoutes from "./routes/auth.routes";
import workflowRoutes from "./routes/workflow.routes";
import webhookRoutes from "./routes/webhook.routes";
import executionRoutes from "./routes/execution.routes";
import { webhookRateLimiter, authRateLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexusflow-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRateLimiter, authRoutes);
app.use("/workflows", workflowRoutes);
app.post("/test", (req, res) => {
  res.json({ message: "test works", body: req.body });
});
app.use("/webhooks", webhookRateLimiter, webhookRoutes);
app.use("/executions", executionRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ API running → http://localhost:${PORT}`);
  });
};

start();
