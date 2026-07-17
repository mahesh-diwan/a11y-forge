import { describe, it, expect } from "vitest";
import { generateReport } from "@/lib/report";
import { generatePdfReport } from "@/lib/pdf";
import type { ScanResult } from "@/lib/types";

const violation = { type: "missing-alt-text", file: "a.tsx", line: 3, description: "img missing alt" } as const;

const result: ScanResult = {
  repoUrl: "https://github.com/o/r",
  violations: [
    { type: "missing-alt-text", file: "a.tsx", line: 3, description: "img missing alt" },
    { type: "low-contrast", file: "b.css", line: 1, description: "low contrast" },
  ],
  score: {
    score: 88, grade: "B", label: "Good", color: "#84cc16",
    totalViolations: 2, breakdown: [{ type: "missing-alt-text", count: 1, impact: 3 }],
    affectedFiles: ["a.tsx", "b.css"],
  },
  screenReader: [
    { file: "a.tsx", line: 3, element: "<img>", current: "[no desc]", fixed: "[desc]", violation: "x" },
  ],
  confidence: [{ violation: { ...violation }, confidence: 95, reasoning: "clear" }],
};

describe("report generation", () => {
  it("html report contains grade + violations", () => {
    const html = generateReport({
      repoUrl: result.repoUrl, score: result.score!, violations: result.violations, screenReader: result.screenReader!,
    });
    expect(html).toContain("B");
    expect(html).toContain("missing-alt-text");
    expect(html).toContain("WCAG");
  });

  it("pdf report produces valid bytes", async () => {
    const bytes = await generatePdfReport(result);
    expect(bytes.length).toBeGreaterThan(100);
    // PDF magic header
    expect(bytes[0]).toBe(0x25); // %
    expect(bytes[1]).toBe(0x50); // P
  });
});
