import { Router, Response } from "express";
import crypto from "crypto";
import { protect, requireRole, AuthRequest } from "../middleware/auth";
import { ApiKey } from "../models/apiKey.model";

const router = Router();

router.use(protect);

router.post(
  "/",
  requireRole("owner", "admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { label, permissions, expiresAt } = req.body;

      if (!label) {
        res.status(400).json({ message: "label is required" });
        return;
      }

      // Generate key: nf_live_<32 random bytes as hex>
      const rawKey = `nf_live_${crypto.randomBytes(32).toString("hex")}`;
      const keyPrefix = rawKey.slice(0, 16);
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

      const apiKey = await ApiKey.create({
        tenantId: req.context!.tenantId,
        createdBy: req.context!.userId,
        label,
        keyHash,
        keyPrefix,
        permissions: permissions || ["trigger", "read"],
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Return raw key ONCE — never stored in plain text
      res.status(201).json({
        apiKey: {
          _id: apiKey._id,
          label: apiKey.label,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          createdAt: apiKey.createdAt,
        },
        key: rawKey, // shown only once
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/",
  requireRole("owner", "admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const keys = await ApiKey.find({
        tenantId: req.context!.tenantId,
        isRevoked: false,
      })
        .select("-keyHash")
        .sort({ createdAt: -1 });

      res.json({ apiKeys: keys });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.delete(
  "/:id",
  requireRole("owner", "admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const apiKey = await ApiKey.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.context!.tenantId },
        { isRevoked: true },
        { new: true },
      );

      if (!apiKey) {
        res.status(404).json({ message: "API key not found" });
        return;
      }

      res.json({ message: "API key revoked" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;
