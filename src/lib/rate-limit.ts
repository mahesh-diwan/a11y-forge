export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfter: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

// In-memory limiter. Swap for Redis/Upstash-backed impl in production
// (serverless instances don't share this Map across replicas).
export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private max = 20,
    private windowMs = 60_000,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || now > entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: this.max - 1,
        resetAfter: this.windowMs,
      };
    }
    entry.count++;
    if (entry.count > this.max) {
      return { allowed: false, remaining: 0, resetAfter: entry.resetAt - now };
    }
    return {
      allowed: true,
      remaining: this.max - entry.count,
      resetAfter: entry.resetAt - now,
    };
  }
}
