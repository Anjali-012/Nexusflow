import { Router, Response } from "express";
import { protect, requireRole, AuthRequest } from "../middleware/auth";
import { ExecutionRun } from "../models/executionRun.model";
import { ExecutionStep } from "../models/executionStep.model";
import { enqueueWorkflow } from "../lib/queue";
import { nanoid } from "nanoid";

const router = Router();

router.use(protect);

router.get(
  "/",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId, status, limit = "20" } = req.query;
      const filter: Record<string, unknown> = {
        tenantId: req.context!.tenantId,
      };
      if (workflowId) filter.workflowId = workflowId;
      if (status) filter.status = status;

      const runs = await ExecutionRun.find(filter)
        .sort({ startedAt: -1 })
        .limit(Number(limit))
        .populate("workflowId", "name");

      res.json({ runs });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/:runId",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
    try {
      const run = await ExecutionRun.findOne({
        _id: req.params.runId,
        tenantId: req.context!.tenantId,
      }).populate("workflowId", "name");

      if (!run) {
        res.status(404).json({ message: "Execution run not found" });
        return;
      }
      res.json({ run });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/:runId/steps",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
    try {
      const run = await ExecutionRun.findOne({
        _id: req.params.runId,
        tenantId: req.context!.tenantId,
      });

      if (!run) {
        res.status(404).json({ message: "Execution run not found" });
        return;
      }

      const steps = await ExecutionStep.find({ runId: req.params.runId }).sort({
        startedAt: 1,
      });
      res.json({ steps });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.post(
  "/:runId/replay",
  requireRole("owner", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const run = await ExecutionRun.findOne({
        _id: req.params.runId,
        tenantId: req.context!.tenantId,
      });

      if (!run) {
        res.status(404).json({ message: "Execution run not found" });
        return;
      }

      const correlationId = `replay-${nanoid(12)}`;

      await enqueueWorkflow({
        workflowId: run.workflowId.toString(),
        tenantId: run.tenantId.toString(),
        triggerPayload: run.triggerPayload || {},
        correlationId,
        triggeredBy: "manual",
      });

      res.status(202).json({ message: "Replay enqueued", correlationId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;
