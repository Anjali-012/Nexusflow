import mongoose, { Document, Schema } from "mongoose";

export interface ICredential extends Document {
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  key: string;
  encryptedValue: string;
  iv: string;
  authTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    encryptedValue: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true },
);

CredentialSchema.index({ tenantId: 1 });
CredentialSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Credential = mongoose.model<ICredential>(
  "Credential",
  CredentialSchema,
);
