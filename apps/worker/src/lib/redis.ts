import { Redis } from "ioredis";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error("Redis error", { error: err.message }));
