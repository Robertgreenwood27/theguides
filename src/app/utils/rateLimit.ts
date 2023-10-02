import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export async function rateLimit(identifier: string) {
  try {
    // Initialize Upstash Redis and Rate Limiter
    const redis = Redis.fromEnv();
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });

    // Attempt to apply rate limiting
    const result = await ratelimit.limit(identifier);

    // Check if rate limiting was successful
    if (!result.success) {
      console.error(`Rate limit exceeded for identifier: ${identifier}`);
    }

    return result;

  } catch (error) {
    // Log the error for debugging
    console.error(`Failed to apply rate limiting for identifier: ${identifier}`);
    console.error(`Error details: ${error.message}`);

    // You can decide what to return or throw in case of an error
    throw new Error('Rate limiting failed');
  }
}
