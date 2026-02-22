import mongoose, { Document, Schema } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  tenantId: mongoose.Types.ObjectId;
  role: "owner" | "editor" | "viewer";
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "owner",
    },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcryptjs.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
