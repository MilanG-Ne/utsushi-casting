/**
 * Best-effort, per-instance fixed-window limiter. It stops casual floods from one client;
 * it is not a distributed limit (each serverless instance keeps its own window).
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000, now = Date.now()): boolean {
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 5000) for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
