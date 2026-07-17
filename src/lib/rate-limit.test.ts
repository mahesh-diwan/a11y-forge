import { describe, it, expect } from "vitest";
import { MemoryRateLimiter } from "./rate-limit";

describe("MemoryRateLimiter", () => {
  it("allows up to MAX then blocks", () => {
    const lim = new MemoryRateLimiter(2, 1000);
    expect(lim.check("a").allowed).toBe(true);
    expect(lim.check("a").allowed).toBe(true);
    expect(lim.check("a").allowed).toBe(false);
  });
  it("resets after window", () => {
    const lim = new MemoryRateLimiter(1, 10);
    expect(lim.check("b").allowed).toBe(true);
    expect(lim.check("b").allowed).toBe(false);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(lim.check("b").allowed).toBe(true);
        resolve();
      }, 20);
    });
  });
});
