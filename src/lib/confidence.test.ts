import { describe, it, expect } from "vitest";
import { scoreConfidence, averageConfidence } from "@/lib/confidence";
import type { Violation } from "@/lib/types";

const mk = (type: string): Violation => ({ type, file: "a.tsx", line: 1, description: type });

describe("scoreConfidence", () => {
  it("returns per-violation results", () => {
    const v = scoreConfidence([mk("missing-alt-text")]);
    expect(v).toHaveLength(1);
    expect(v[0].violation.type).toBe("missing-alt-text");
    expect(v[0].confidence).toBeGreaterThanOrEqual(0);
  });

  it("boosts alt-text with src snippet", () => {
    const v = scoreConfidence([{
      type: "missing-alt-text", file: "a.tsx", line: 1,
      description: "no alt", snippet: '<img src="x.png">',
    }]);
    expect(v[0].confidence).toBeGreaterThan(80);
  });
});

describe("averageConfidence", () => {
  it("averages results", () => {
    const r = scoreConfidence([mk("missing-alt-text"), mk("low-contrast")]);
    const avg = averageConfidence(r);
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(100);
  });

  it("returns 0 for empty array", () => {
    expect(averageConfidence([])).toBe(0);
  });
});
