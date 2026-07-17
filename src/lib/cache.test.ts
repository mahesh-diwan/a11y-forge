import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheGet, cacheSet, cacheClear } from "./cache";

beforeEach(() => {
  cacheClear();
});

describe("cache", () => {
  it("returns stored value", () => {
    cacheSet("key1", "hello");
    expect(cacheGet("key1")).toBe("hello");
  });

  it("returns undefined for missing key", () => {
    expect(cacheGet("nope")).toBeUndefined();
  });

  it("returns undefined after expiry", () => {
    vi.useFakeTimers();
    cacheSet("key2", "value");
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(cacheGet("key2")).toBeUndefined();
    vi.useRealTimers();
  });

  it("stores objects", () => {
    const obj = { a: 1 };
    cacheSet("obj", obj);
    expect(cacheGet("obj")).toEqual(obj);
  });

  it("clears all entries", () => {
    cacheSet("a", 1);
    cacheSet("b", 2);
    cacheClear();
    expect(cacheGet("a")).toBeUndefined();
    expect(cacheGet("b")).toBeUndefined();
  });
});
