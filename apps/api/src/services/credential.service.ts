import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function deriveKey(tenantId: string): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY!;
  return crypto.scryptSync(masterKey, tenantId, KEY_LENGTH);
}

export function encrypt(
  value: string,
  tenantId: string,
): {
  encryptedValue: string;
  iv: string;
  authTag: string;
} {
  const key = deriveKey(tenantId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedValue: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

export function decrypt(
  encryptedValue: string,
  iv: string,
  authTag: string,
  tenantId: string,
): string {
  const key = deriveKey(tenantId);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
