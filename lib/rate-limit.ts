/**
 * Simple in-process rate limiter using a sliding window.
 * For production at scale, replace with Upstash Redis ratelimit.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000 * 10) store.delete(key);
    }
  }, 300_000);
}

/**
 * Returns true if the request should be blocked.
 * @param key     — unique identifier (e.g. "nudge:userId")
 * @param limit   — max requests allowed
 * @param windowMs — sliding window in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

export function rateLimitedResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
