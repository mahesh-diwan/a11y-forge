import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRateLimiter, UpstashRateLimiter } from "./rate-limit";

describe("MemoryRateLimiter", () => {
  it("allows up to MAX then blocks", async () => {
    const lim = new MemoryRateLimiter(2, 1000);
    expect((await lim.check("a")).allowed).toBe(true);
    expect((await lim.check("a")).allowed).toBe(true);
    expect((await lim.check("a")).allowed).toBe(false);
  });
  it("resets after window", async () => {
    const lim = new MemoryRateLimiter(1, 10);
    expect((await lim.check("b")).allowed).toBe(true);
    expect((await lim.check("b")).allowed).toBe(false);
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 20);
    });
    expect((await lim.check("b")).allowed).toBe(true);
  });
});

describe("UpstashRateLimiter", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows first request (INCR=1, calls EXPIRE)", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 55 }) });
    vi.stubGlobal("fetch", fetch);

    const lim = new UpstashRateLimiter(20, 60_000);
    const r = await lim.check("k");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(19);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("allows subsequent request within limit (INCR=5, no EXPIRE)", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 5 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 30 }) });
    vi.stubGlobal("fetch", fetch);

    const lim = new UpstashRateLimiter(20, 60_000);
    const r = await lim.check("k");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(15);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("blocks after limit (INCR=21)", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 21 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 30 }) });
    vi.stubGlobal("fetch", fetch);

    const lim = new UpstashRateLimiter(20, 60_000);
    const r = await lim.check("k");
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("throws on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    const lim = new UpstashRateLimiter(20, 60_000);
    await expect(lim.check("k")).rejects.toThrow("Network failure");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const lim = new UpstashRateLimiter(20, 60_000);
    await expect(lim.check("k")).rejects.toThrow("Upstash Redis error: 429");
  });

  it("throws on JSON error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "ERR limit exceeded" }) }));
    const lim = new UpstashRateLimiter(20, 60_000);
    await expect(lim.check("k")).rejects.toThrow("Upstash Redis error: ERR limit exceeded");
  });
});
