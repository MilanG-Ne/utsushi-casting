/**
 * Best-effort, per-instance fixed-window limiter. It stops casual floods from one client;
 * it is not a distributed limit (each serverless instance keeps its own window), and the
 * client IP is only as trustworthy as the proxy in front of the app. Use the platform
 * firewall for real abuse protection.
 */
const windows = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5000;

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000, now = Date.now()): boolean {
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.delete(key);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    // Bounded memory: Map iterates in insertion order, so the first keys are the oldest.
    while (windows.size > MAX_KEYS) windows.delete(windows.keys().next().value!);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
