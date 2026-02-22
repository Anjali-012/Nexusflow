import { Router, Response } from "express";
import { nanoid } from "nanoid";
import { Workflow } from "../models/workflow.model";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// All workflow routes are protected
router.use(protect);

// GET /workflows — list all workflows for tenant
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await Workflow.find({
      tenantId: req.context!.tenantId,
    })
      .select("-nodes -edges")
      .sort({ createdAt: -1 });

    res.json({ workflows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /workflows/:id — get single workflow
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      tenantId: req.context!.tenantId,
    });

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    res.json({ workflow });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /workflows — create workflow
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, trigger } = req.body;

    const workflow = await Workflow.create({
      tenantId: req.context!.tenantId,
      createdBy: req.context!.userId,
      name,
      description,
      trigger: {
        type: trigger?.type || "manual",
        config: trigger?.config || {},
        webhookId: trigger?.type === "webhook" ? nanoid() : undefined,
      },
    });

    res.status(201).json({ workflow });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /workflows/:id — update workflow
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.context!.tenantId,
      },
      { $set: req.body },
      { new: true },
    );

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    res.json({ workflow });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /workflows/:id — delete workflow
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.context!.tenantId,
    });

    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }

    res.json({ message: "Workflow deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
