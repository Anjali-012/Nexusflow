import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ExecutionRun } from "../models/executionRun.model";
import { redis } from "../lib/redis";
import {
  addClient,
  removeClient,
  sendEvent,
  initSSEResponse,
} from "../lib/sse";

const router = Router();

router.get("/:runId/stream", async (req: Request, res: Response) => {
  const token =
    (req.query.token as string) || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  let context: { userId: string; tenantId: string; role: string };
  try {
    context = jwt.verify(token, process.env.JWT_SECRET!) as typeof context;
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  const runId = String(req.params.runId);
  const tenantId = context.tenantId;

  const run = await ExecutionRun.findOne({ _id: runId, tenantId });
  if (!run) {
    res.status(404).json({ message: "Execution run not found" });
    return;
  }

  initSSEResponse(res);
  addClient(runId, res);
  sendEvent(runId, "connected", { runId, status: run.status });

  const channel = `execution:${runId}`;
  const subscriber = redis.duplicate();
  await subscriber.subscribe(channel);

  subscriber.on("message", (_, message) => {
    try {
      const parsed = JSON.parse(message);
      sendEvent(runId, parsed.event, parsed.data);
      if (parsed.event === "run:completed" || parsed.event === "run:failed") {
        cleanup();
      }
    } catch {
      // ignore malformed messages
    }
  });

  const cleanup = () => {
    removeClient(runId, res);
    subscriber.unsubscribe(channel);
    subscriber.quit();
    res.end();
  };

  req.on("close", cleanup);
});

export default router;
