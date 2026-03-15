import { Redis } from "ioredis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error("Redis error", { error: err.message }));
