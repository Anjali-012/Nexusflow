import { Router, Response } from "express";
import { protect, AuthRequest } from "../middleware/auth";
import { ExecutionRun } from "../models/executionRun.model";
import { ExecutionStep } from "../models/executionStep.model";

const router = Router();

router.use(protect);

// GET /executions?workflowId=xxx&status=xxx&limit=20
// List execution runs for tenant (optionally filtered by workflow)
router.get("/", async (req: AuthRequest, res: Response) => {
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
      .populate("workflowId", "name"); // show workflow name in response

    res.json({ runs });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /executions/:runId — get single run details
router.get("/:runId", async (req: AuthRequest, res: Response) => {
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
});

// GET /executions/:runId/steps — get all steps for a run (Run Inspector)
router.get("/:runId/steps", async (req: AuthRequest, res: Response) => {
  try {
    // Verify the run belongs to this tenant first
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
});

export default router;
