import { describe, it, expect } from "vitest";
import { checkContrast, contrastRatio, parseColor } from "@/lib/contrast";

describe("contrast", () => {
  it("parses hex and rgb", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("rgb(0,0,0)")).toEqual([0, 0, 0]);
  });

  it("computes max ratio for black/white", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
  });

  it("flags low-contrast inline style", () => {
    const v = checkContrast('<div style="color:#aaa; background:#bbb">x</div>', "a.html");
    expect(v.some((x) => x.type === "low-contrast")).toBe(true);
  });

  it("ignores sufficient contrast", () => {
    const v = checkContrast('<div style="color:#000; background:#fff">x</div>', "a.html");
    expect(v).toHaveLength(0);
  });
});
