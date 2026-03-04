import { redis } from "../lib/redis";

export async function publish(
  runId: string,
  event: string,
  data: unknown,
): Promise<void> {
  await redis.publish(`execution:${runId}`, JSON.stringify({ event, data }));
}
