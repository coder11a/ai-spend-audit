type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string) {
  const max = Number(process.env.RATE_LIMIT_MAX ?? 8);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60) * 1000;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (bucket.count >= max) return { allowed: false, remaining: 0 };

  bucket.count += 1;
  return { allowed: true, remaining: Math.max(0, max - bucket.count) };
}
