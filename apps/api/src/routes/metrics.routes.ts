import { Router, Request, Response } from "express";
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route", "status"],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
  registers: [registry],
});

export const executionDuration = new Histogram({
  name: "workflow_execution_duration_ms",
  help: "Workflow execution duration in milliseconds",
  labelNames: ["status"],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
  registers: [registry],
});

export const queueDepthGauge = new Gauge({
  name: "bullmq_queue_depth",
  help: "Current BullMQ queue depth",
  labelNames: ["queue"],
  registers: [registry],
});

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

export default router;
