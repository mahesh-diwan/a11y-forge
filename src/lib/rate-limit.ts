export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfter: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private max = 20,
    private windowMs = 60_000,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
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

export class UpstashRateLimiter implements RateLimiter {
  constructor(
    private max = 20,
    private windowMs = 60_000,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const redisKey = `rate-limit:${key}`;
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

    const count = await this.command<number>(url, token, ["INCR", redisKey]);
    if (count === 1) {
      await this.command(url, token, ["EXPIRE", redisKey, Math.ceil(this.windowMs / 1_000)]);
    }

    if (count > this.max) {
      const ttl = await this.command<number>(url, token, ["TTL", redisKey]);
      return { allowed: false, remaining: 0, resetAfter: Math.max(0, ttl * 1_000) };
    }

    const ttl = await this.command<number>(url, token, ["TTL", redisKey]);
    return {
      allowed: true,
      remaining: this.max - count,
      resetAfter: Math.max(0, ttl * 1_000),
    };
  }

  private async command<T>(url: string, token: string, args: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Upstash Redis error: ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`Upstash Redis error: ${json.error}`);
    return json.result as T;
  }
}

/** Singleton — Upstash when env vars present, Memory fallback otherwise */
export const sharedLimiter: RateLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashRateLimiter(20, 60_000)
    : new MemoryRateLimiter(20, 60_000);
