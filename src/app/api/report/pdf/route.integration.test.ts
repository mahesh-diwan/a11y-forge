import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/report/pdf/route";
import { NextRequest } from "next/server";

describe("/api/report/pdf integration", () => {
  it("returns PDF for valid ScanResult", async () => {
    const req = new NextRequest("http://localhost/api/report/pdf", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/o/r",
        violations: [],
        score: {
          score: 90,
          grade: "A",
          label: "Good",
          color: "#b087f9",
          totalViolations: 0,
          breakdown: [],
          affectedFiles: [],
        },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost/api/report/pdf", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });
});
