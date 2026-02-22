import mongoose, { Document, Schema } from "mongoose";

export interface ITenant extends Document {
  name: string;
  slug: string;
  planType: "free" | "pro" | "enterprise";
  createdAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    planType: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
  },
  { timestamps: true },
);

export const Tenant = mongoose.model<ITenant>("Tenant", TenantSchema);
