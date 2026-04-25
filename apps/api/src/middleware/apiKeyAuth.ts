import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ApiKey } from "../models/apiKey.model";
import { AuthRequest } from "./auth";

export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rawKey = req.headers["x-api-key"] as string;
  if (!rawKey) {
    next();
    return;
  }

  try {
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const apiKey = await ApiKey.findOne({ keyHash, isRevoked: false });

    if (!apiKey) {
      res.status(401).json({ message: "Invalid API key" });
      return;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      res.status(401).json({ message: "API key expired" });
      return;
    }

    // Update last used
    await ApiKey.findByIdAndUpdate(apiKey._id, { lastUsedAt: new Date() });

    // Attach context same as JWT middleware
    (req as AuthRequest).context = {
      userId: apiKey.createdBy.toString(),
      tenantId: apiKey.tenantId.toString(),
      role: apiKey.permissions.includes("admin") ? "owner" : "editor",
    };

    next();
  } catch (err) {
    res.status(500).json({ message: "API key verification failed" });
  }
}
