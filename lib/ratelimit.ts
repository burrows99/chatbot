import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";
import { redis } from "@/lib/storage/redis";

const MAX_MESSAGES = 10;
const TTL_SECONDS = 60 * 60;

export async function checkIpRateLimit(ip: string | undefined) {
  if (!isProductionEnvironment || !ip) {
    return;
  }

  if (!redis.isReady) {
    return;
  }

  const client = redis.getClient();
  if (!client) {
    return;
  }

  try {
    const key = `ip-rate-limit:${ip}`;
    const [count] = await client
      .multi()
      .incr(key)
      .expire(key, TTL_SECONDS, "NX")
      .exec();

    if (typeof count === "number" && count > MAX_MESSAGES) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
