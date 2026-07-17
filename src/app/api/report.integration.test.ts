import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/report/route";
import { NextRequest } from "next/server";

describe("/api/report integration", () => {
  it("returns HTML report for valid payload", async () => {
    const req = new NextRequest("http://localhost/api/report", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/o/r",
        score: {
          score: 90,
          grade: "A",
          label: "Good",
          color: "#b087f9",
          totalViolations: 1,
          breakdown: [],
          affectedFiles: ["a.html"],
        },
        violations: [
          { type: "missing-alt-text", file: "a.html", line: 1, description: "no alt" },
        ],
        screenReader: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/report", {
      method: "POST",
      body: "{bad",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });
});
