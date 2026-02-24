import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import { Workflow } from "../models/workflow.model";
import { enqueueWorkflow } from "../lib/queue";

const router = Router();

// POST /webhooks/:webhookId
// Public endpoint — no auth required (validated by webhookId lookup)
router.post("/:webhookId", async (req: Request, res: Response) => {
  const start = Date.now();

  try {
    const { webhookId } = req.params;

    // Find workflow by webhookId
    const workflow = await Workflow.findOne({
      "trigger.webhookId": webhookId,
      "trigger.type": "webhook",
      status: "active",
    }).select("_id tenantId status trigger");

    if (!workflow) {
      res
        .status(404)
        .json({ message: "Webhook not found or workflow is not active" });
      return;
    }

    // Enqueue job — must return 202 in under 50ms
    const correlationId = `${webhookId}-${nanoid(8)}`;

    await enqueueWorkflow({
      workflowId: workflow._id.toString(),
      tenantId: workflow.tenantId.toString(),
      triggerPayload: req.body || {},
      correlationId,
      triggeredBy: "webhook",
    });

    const duration = Date.now() - start;
    console.log(
      `[Webhook] Enqueued job in ${duration}ms — correlationId: ${correlationId}`,
    );

    // Always 202 — we accepted the job, not completed it
    res.status(202).json({
      message: "Workflow triggered",
      correlationId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  }
});

// POST /workflows/:id/trigger — manual trigger from UI
router.post("/manual/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    const workflow = await Workflow.findById(workflowId).select(
      "_id tenantId status",
    );

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    const correlationId = `manual-${nanoid(12)}`;

    await enqueueWorkflow({
      workflowId: workflow._id.toString(),
      tenantId: workflow.tenantId.toString(),
      triggerPayload: req.body || {},
      correlationId,
      triggeredBy: "manual",
    });

    res.status(202).json({
      message: "Workflow triggered manually",
      correlationId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  }
});

export default router;
