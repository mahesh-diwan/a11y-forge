import { describe, it, expect, vi } from "vitest";
import { coalesce } from "./coalesce";

describe("coalesce", () => {
  it("dedupes concurrent calls", async () => {
    const fn = vi.fn(async () => "result");
    const [a, b] = await Promise.all([coalesce("k", fn), coalesce("k", fn)]);
    expect(a).toBe("result");
    expect(b).toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("separate keys run separately", async () => {
    const fn = vi.fn(async (x: string) => x);
    const [a, b] = await Promise.all([
      coalesce("x", () => fn("x")),
      coalesce("y", () => fn("y")),
    ]);
    expect(a).toBe("x");
    expect(b).toBe("y");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
