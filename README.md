# NexusFlow

A high-performance, multi-tenant visual workflow automation platform. Build complex automation pipelines through a drag-and-drop interface — think Zapier, but engineered from scratch.

---

## What It Does

NexusFlow lets users visually construct automation workflows by connecting nodes on a canvas. Each workflow is stored as a Directed Acyclic Graph (DAG) and executed asynchronously by a BullMQ worker fleet. Trigger a workflow via webhook, schedule, or manual trigger — the execution engine traverses the DAG in topological order, passing data between nodes, handling retries, and streaming real-time status back to the frontend.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  API Gateway│────▶│  BullMQ     │
│  (Next.js)  │◀────│  (Express)  │     │  Queue      │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                   │                   │
       │ SSE               │ MongoDB           ▼
       │                   │            ┌─────────────┐
       │            ┌──────┴──────┐     │   Worker    │
       └────────────│    Redis    │◀────│  (DAG Runner│
                    │  Pub/Sub   │     │  + Scheduler│
                    └─────────────┘     └─────────────┘
```

**Request flow:**

1. Webhook hits API → job enqueued in BullMQ within 50ms → HTTP 202 returned
2. Worker picks up job → fetches workflow DAG from MongoDB → traverses nodes in topological order
3. Each node executes (HTTP call, AI inference, condition check, delay)
4. Results streamed to frontend via Redis pub/sub → SSE

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 15, React Flow, Zustand, TanStack Query |
| API            | Node.js, Express 5, JWT + API Key auth          |
| Worker         | BullMQ, node-cron, Groq (LLM)                   |
| Collaboration  | Y.js CRDTs, Hocuspocus WebSocket server         |
| Database       | MongoDB 8, Mongoose                             |
| Cache / Queue  | Redis 7, BullMQ                                 |
| Monitoring     | Prometheus, Winston (structured logging)        |
| Infrastructure | Docker, Kubernetes, KEDA autoscaling, Nginx     |
| CI/CD          | GitHub Actions, GitHub Container Registry       |

---

## Features

### Core

- **Visual DAG Designer** — drag-and-drop canvas built on React Flow with node palette, config panels, and auto-save
- **Async Execution Engine** — BullMQ + Redis queue, topological DAG traversal, concurrent node execution
- **Real-time SSE Stream** — execution status streamed node-by-node to the designer panel
- **Execution History** — full run feed with step-level inspector, input/output payloads, error details

### Nodes

- **Triggers** — Webhook, Schedule (cron), Manual
- **Actions** — HTTP Request, Delay
- **Logic** — If/Else condition with JSONPath evaluation
- **Transform** — Data mapper with `{{template}}` syntax
- **AI Copilot** — Natural language node powered by Groq LLaMA 3.3

### Resilience

- Exponential backoff retry with configurable `RetryPolicy` per workflow
- Dead-letter queue for failed jobs after retry exhaustion
- One-click execution replay from history dashboard
- AES-256-GCM credential encryption with `$SECRET:key` resolver at runtime

### Security

- JWT RBAC with `owner`, `editor`, `viewer` roles
- API key authentication (`nf_live_*` keys) for SDK/machine access
- Multi-tenant data isolation — all queries scoped by `tenantId` from JWT
- Redis sliding-window rate limiting on webhook and auth endpoints

### Platform

- **Developer SDK** (`@nexusflow/sdk`) — `workflows.trigger()`, `executions.waitForCompletion()`, `webhooks.verify()`
- **Real-time Collaboration** — Y.js CRDTs + Hocuspocus for simultaneous multi-user canvas editing
- **Schedule Trigger** — cron-based workflow execution with timezone support
- **Bull Board** — queue monitoring dashboard at `/admin/queues`
- **Prometheus metrics** — `http_requests_total`, `workflow_execution_duration_ms`, `bullmq_queue_depth`

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- MongoDB 8
- Redis 7

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/nexusflow.git
cd nexusflow

# Start MongoDB and Redis
docker compose up mongodb redis -d

# Install dependencies
cd apps/api && npm install
cd ../worker && npm install
cd ../frontend && npm install
cd ../collab && npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

### Environment Variables

**`apps/api/.env`**

```
MONGODB_URI=mongodb://localhost:27017/nexusflow
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
ENCRYPTION_KEY=your-64-char-hex
ALLOWED_ORIGINS=http://localhost:3000
```

**`apps/worker/.env`**

```
MONGODB_URI=mongodb://localhost:27017/nexusflow
REDIS_HOST=localhost
REDIS_PORT=6379
ENCRYPTION_KEY=your-64-char-hex
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```

**`apps/frontend/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COLLAB_URL=ws://localhost:1234
```

### Run All Services

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Worker + Scheduler
cd apps/worker && npm run dev

# Terminal 3 — Frontend
cd apps/frontend && npm run dev

# Terminal 4 — Collaboration server
cd apps/collab && npm run dev
```

Open `http://localhost:3000`

---

## Project Structure

```
nexusflow/
├── apps/
│   ├── api/          # Express API Gateway
│   ├── worker/       # BullMQ Worker + DAG Runner + Scheduler
│   ├── frontend/     # Next.js Frontend
│   └── collab/       # Hocuspocus Collaboration Server
├── packages/
│   └── sdk/          # @nexusflow/sdk — Developer SDK
├── k8s/              # Kubernetes manifests + KEDA ScaledObject
├── nginx/            # Nginx reverse proxy config
├── tests/
│   └── load/         # k6 load test scripts
└── .github/
    └── workflows/    # GitHub Actions CI pipeline
```

---

## API

| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| POST   | `/auth/register`            | Register user + tenant     |
| POST   | `/auth/login`               | Login, returns JWT         |
| GET    | `/workflows`                | List workflows             |
| POST   | `/workflows`                | Create workflow            |
| PATCH  | `/workflows/:id`            | Update workflow            |
| DELETE | `/workflows/:id`            | Delete workflow            |
| POST   | `/webhooks/:webhookId`      | Trigger via webhook        |
| POST   | `/webhooks/manual/:id`      | Manual trigger             |
| GET    | `/executions`               | List execution runs        |
| GET    | `/executions/:runId/steps`  | Get run steps              |
| POST   | `/executions/:runId/replay` | Replay a run               |
| GET    | `/executions/:runId/stream` | SSE execution stream       |
| POST   | `/credentials`              | Store encrypted credential |
| POST   | `/api-keys`                 | Generate API key           |
| GET    | `/metrics`                  | Prometheus metrics         |
| GET    | `/admin/queues`             | Bull Board dashboard       |

---

## SDK Usage

```typescript
import { NexusFlowClient } from "@nexusflow/sdk";

const client = new NexusFlowClient({
  apiKey: "nf_live_your_key",
  baseUrl: "http://localhost:3001",
});

// Trigger a workflow
const { correlationId } = await client.workflows.trigger("workflow_id", {
  payload: { orderId: "123" },
  idempotencyKey: "order-123-trigger",
});

// Wait for completion
const run = await client.executions.waitForCompletion(correlationId);
console.log(run.status); // "success"
```

---

## Testing

```bash
# Integration tests (17 tests)
cd apps/api && npm test

# Load test — 1000 VUs, p99 < 100ms
k6 run tests/load/webhook.js
```

---

## Deployment

```bash
# Build Docker images
docker build -t nexusflow-api ./apps/api
docker build -t nexusflow-worker ./apps/worker

# Production Docker Compose
docker compose -f docker-compose.prod.yml up

# Kubernetes
kubectl apply -f k8s/
```

CI/CD via GitHub Actions — on merge to `main`, images are built and pushed to GitHub Container Registry.

---

## Interview Talking Points

- **Queue-based load leveling** — webhooks return 202 in under 50ms regardless of load
- **Kahn's Algorithm** — topological sort for DAG traversal with parallel branch support
- **AES-256-GCM encryption** — per-tenant key derivation using HKDF, credential resolver at runtime
- **CRDTs** — Y.js conflict-free replicated data types for real-time collaboration without conflicts
- **KEDA autoscaling** — Kubernetes worker pods scale based on BullMQ queue depth
- **SSE over WebSockets** — unidirectional server push for execution streaming, simpler and more reliable
