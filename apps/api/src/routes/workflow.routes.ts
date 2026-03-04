import { Router, Response } from "express";
import { nanoid } from "nanoid";
import { Workflow } from "../models/workflow.model";
import { protect, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get(
  "/",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
    try {
      const workflows = await Workflow.find({ tenantId: req.context!.tenantId })
        .select("-nodes -edges")
        .sort({ createdAt: -1 });
      res.json({ workflows });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/:id",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
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
  },
);

router.post(
  "/",
  requireRole("owner", "editor"),
  async (req: AuthRequest, res: Response) => {
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
  },
);

router.patch(
  "/:id",
  requireRole("owner", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const workflow = await Workflow.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.context!.tenantId },
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
  },
);

router.delete(
  "/:id",
  requireRole("owner"),
  async (req: AuthRequest, res: Response) => {
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
  },
);

export default router;
