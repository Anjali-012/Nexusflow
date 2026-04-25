import mongoose, { Document, Schema } from "mongoose";

export interface IApiKey extends Document {
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  label: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ("trigger" | "read" | "admin")[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    permissions: {
      type: [String],
      enum: ["trigger", "read", "admin"],
      default: ["trigger", "read"],
    },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ApiKeySchema.index({ tenantId: 1, isRevoked: 1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
