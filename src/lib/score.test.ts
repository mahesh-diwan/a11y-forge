import { describe, it, expect } from "vitest";
import { calculateScore } from "@/lib/score";
import type { Violation } from "@/lib/types";

function v(type: string): Violation {
  return { type, file: "a.tsx", line: 1, description: type };
}

describe("calculateScore", () => {
  it("gives A+ for zero violations", () => {
    const s = calculateScore([]);
    expect(s.grade).toBe("A+");
    expect(s.score).toBe(100);
  });

  it("penalizes by weight and file count", () => {
    const s = calculateScore([v("missing-alt-text"), v("missing-alt-text")]);
    expect(s.score).toBeLessThan(100);
    expect(s.totalViolations).toBe(2);
  });

  it("never returns negative", () => {
    const many = Array.from({ length: 100 }, () => v("missing-alt-text"));
    const s = calculateScore(many);
    expect(s.score).toBeGreaterThanOrEqual(0);
  });
});
