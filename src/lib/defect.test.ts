import { describe, it, expect } from "vitest";
import { checkContrast } from "@/lib/contrast";
import { calculateScore } from "@/lib/score";
import type { Violation } from "@/lib/types";

function v(type: string): Violation {
  return { type, file: "a.tsx", line: 1, description: type };
}

describe("DEFECT: contrast double-count", () => {
  it("one div with inline color/bg yields ONE low-contrast (not two)", () => {
    const out = checkContrast('<div style="color:#aaa; background:#bbb">x</div>', "a.html");
    const lc = out.filter((x) => x.type === "low-contrast");
    expect(lc.length).toBe(1);
  });
});

describe("DEFECT: score scaling meaningless for small repos", () => {
  it("10 alt-text violations in a 2-file repo should score low, not ~98", () => {
    const vs = Array.from({ length: 10 }, () => v("missing-alt-text"));
    const s = calculateScore(vs);
    // 10*3 impact / 2 files = 15 penalty at minimum; expect well below 90
    expect(s.score).toBeLessThan(90);
  });
});
