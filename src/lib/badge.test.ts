import { describe, it, expect } from "vitest";
import { generateBadge } from "@/lib/badge";
import type { ScoreResult } from "@/lib/types";

const base: ScoreResult = {
  score: 85, grade: "A", label: "Good", color: "#22c55e",
  totalViolations: 10, breakdown: [], affectedFiles: [],
};

describe("generateBadge", () => {
  it("returns SVG string", () => {
    const svg = generateBadge(base);
    expect(svg).toContain("<svg");
    expect(svg).toContain("A");
  });

  it("uses grade color", () => {
    const f: ScoreResult = { ...base, grade: "F", color: "#ef4444" };
    expect(generateBadge(f)).toContain("#ef4444");
  });

  it("falls back for unknown grade", () => {
    const u: ScoreResult = { ...base, grade: "?", color: "#6b7280" };
    expect(generateBadge(u)).toContain("#6b7280");
  });
});
