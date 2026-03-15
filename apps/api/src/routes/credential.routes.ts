import { Router, Response } from "express";
import { protect, requireRole, AuthRequest } from "../middleware/auth";
import { Credential } from "../models/credential.model";
import { encrypt, decrypt } from "../services/credential.service";

const router = Router();

router.use(protect);

router.post(
  "/",
  requireRole("owner", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, key, value } = req.body;

      if (!name || !key || !value) {
        res.status(400).json({ message: "name, key, and value are required" });
        return;
      }

      const { encryptedValue, iv, authTag } = encrypt(
        value,
        req.context!.tenantId,
      );

      const credential = await Credential.create({
        tenantId: req.context!.tenantId,
        createdBy: req.context!.userId,
        name,
        key,
        encryptedValue,
        iv,
        authTag,
      });

      res.status(201).json({
        credential: {
          _id: credential._id,
          name: credential.name,
          key: credential.key,
          createdAt: credential.createdAt,
        },
      });
    } catch (err: any) {
      if (err.code === 11000) {
        res
          .status(409)
          .json({ message: "A credential with this key already exists" });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/",
  requireRole("owner", "editor", "viewer"),
  async (req: AuthRequest, res: Response) => {
    try {
      const credentials = await Credential.find({
        tenantId: req.context!.tenantId,
      })
        .select("_id name key createdAt updatedAt")
        .sort({ createdAt: -1 });

      res.json({ credentials });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/:id",
  requireRole("owner", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const credential = await Credential.findOne({
        _id: req.params.id,
        tenantId: req.context!.tenantId,
      });

      if (!credential) {
        res.status(404).json({ message: "Credential not found" });
        return;
      }

      const value = decrypt(
        credential.encryptedValue,
        credential.iv,
        credential.authTag,
        req.context!.tenantId,
      );

      res.json({
        credential: {
          _id: credential._id,
          name: credential.name,
          key: credential.key,
          value,
          createdAt: credential.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.delete(
  "/:id",
  requireRole("owner"),
  async (req: AuthRequest, res: Response) => {
    try {
      const credential = await Credential.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.context!.tenantId,
      });

      if (!credential) {
        res.status(404).json({ message: "Credential not found" });
        return;
      }

      res.json({ message: "Credential deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;
