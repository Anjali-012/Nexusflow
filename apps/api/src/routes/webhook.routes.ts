import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import { Workflow } from "../models/workflow.model";
import { enqueueWorkflow } from "../lib/queue";

const router = Router();

router.post("/:webhookId", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const { webhookId } = req.params;

    const workflow = await Workflow.findOne({
      "trigger.webhookId": webhookId,
      "trigger.type": "webhook",
      status: "active",
    }).select("_id tenantId status trigger settings");

    if (!workflow) {
      res
        .status(404)
        .json({ message: "Webhook not found or workflow is not active" });
      return;
    }

    const correlationId = `${webhookId}-${nanoid(8)}`;

    await enqueueWorkflow(
      {
        workflowId: workflow._id.toString(),
        tenantId: workflow.tenantId.toString(),
        triggerPayload: req.body || {},
        correlationId,
        triggeredBy: "webhook",
      },
      workflow.settings.retryPolicy,
    );

    const duration = Date.now() - start;
    console.log(
      `[Webhook] Enqueued job in ${duration}ms — correlationId: ${correlationId}`,
    );

    res.status(202).json({ message: "Workflow triggered", correlationId });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  }
});

router.post("/manual/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    const workflow = await Workflow.findById(workflowId).select(
      "_id tenantId status settings",
    );

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    const correlationId = `manual-${nanoid(12)}`;

    await enqueueWorkflow(
      {
        workflowId: workflow._id.toString(),
        tenantId: workflow.tenantId.toString(),
        triggerPayload: req.body || {},
        correlationId,
        triggeredBy: "manual",
      },
      workflow.settings.retryPolicy,
    );

    res
      .status(202)
      .json({ message: "Workflow triggered manually", correlationId });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  }
});

export default router;
