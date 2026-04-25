import crypto from "crypto";
import mongoose from "mongoose";

export interface ExecutionContext {
  workflowId: string;
  tenantId: string;
  correlationId: string;
  triggerPayload: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

// Lazy-load credential model to avoid circular imports
async function getCredentialModel() {
  const { default: mongoose } = await import("mongoose");
  const schema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    key: String,
    encryptedValue: String,
    iv: String,
    authTag: String,
  });
  return mongoose.models.Credential || mongoose.model("Credential", schema);
}

function decryptCredential(
  encryptedValue: string,
  iv: string,
  authTag: string,
  tenantId: string,
): string {
  const masterKey = process.env.ENCRYPTION_KEY!;
  const key = crypto.scryptSync(masterKey, tenantId, 32);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

async function resolveSecret(key: string, tenantId: string): Promise<string> {
  const Credential = await getCredentialModel();
  const credential = await Credential.findOne({
    key,
    tenantId: new mongoose.Types.ObjectId(tenantId),
  });

  if (!credential) {
    throw new Error(`Credential not found: ${key}`);
  }

  return decryptCredential(
    credential.encryptedValue,
    credential.iv,
    credential.authTag,
    tenantId,
  );
}

export function resolveTemplate(value: string, ctx: ExecutionContext): string {
  return value.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const parts = path.trim().split(".");
    let current: unknown = {
      trigger: ctx.triggerPayload,
      nodes: ctx.nodeOutputs,
    };
    for (const part of parts) {
      current = (current as Record<string, unknown>)?.[part];
    }
    return current !== undefined ? String(current) : "";
  });
}

export async function resolveConfig(
  config: Record<string, unknown>,
  ctx: ExecutionContext,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      // Handle $SECRET:key_name pattern
      if (value.startsWith("$SECRET:")) {
        const secretKey = value.slice("$SECRET:".length).trim();
        resolved[key] = await resolveSecret(secretKey, ctx.tenantId);
      } else {
        resolved[key] = resolveTemplate(value, ctx);
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
