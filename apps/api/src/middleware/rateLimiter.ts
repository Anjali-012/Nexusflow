import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix } = options;
  const windowSeconds = Math.floor(windowMs / 1000);

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${keyPrefix}:${ip}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));

      if (current > max) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", ttl);
        res.status(429).json({
          message: "Too many requests — please try again later.",
          retryAfter: ttl,
        });
        return;
      }

      next();
    } catch {
      next();
    }
  };
}

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "rl:webhook",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 20,
  keyPrefix: "rl:auth",
});
