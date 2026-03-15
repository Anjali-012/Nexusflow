import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("error_rate");
const webhookDuration = new Trend("webhook_duration");

// Test configuration per SRS: 1000 concurrent users, p99 < 100ms
export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "30s", target: 500 },
    { duration: "60s", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<100"],
    error_rate: ["rate<0.01"],
    webhook_duration: ["p(99)<100"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const WEBHOOK_ID = __ENV.WEBHOOK_ID || "your-webhook-id";

export default function () {
  // Test 1 — Health check (baseline)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "health check status 200": (r) => r.status === 200,
    "health check under 50ms": (r) => r.timings.duration < 50,
  });

  // Test 2 — Webhook trigger (main load test per SRS)
  const webhookRes = http.post(
    `${BASE_URL}/webhooks/manual/${WEBHOOK_ID}`,
    JSON.stringify({ test: true, timestamp: Date.now() }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${__ENV.TOKEN}`,
      },
    },
  );

  const webhookSuccess = check(webhookRes, {
    "webhook returns 202": (r) => r.status === 202,
    "webhook under 100ms": (r) => r.timings.duration < 100,
    "webhook has correlationId": (r) => {
      try {
        return JSON.parse(String(r.body)).correlationId !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!webhookSuccess);
  webhookDuration.add(webhookRes.timings.duration);

  sleep(0.1);
}
