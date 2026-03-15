import mongoose from "mongoose";
import logger from "./logger";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nexusflow";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB failed", { error: (err as Error).message });
    process.exit(1);
  }
};
