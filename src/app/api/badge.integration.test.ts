import { describe, it, expect } from "vitest";
import { POST, GET } from "@/app/api/badge/route";
import { NextRequest } from "next/server";

describe("/api/badge integration", () => {
  it("returns 400 for invalid score data", async () => {
    const req = new NextRequest("http://localhost/api/badge", {
      method: "POST",
      body: JSON.stringify({ score: { label: "ok" } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 200 SVG for valid score", async () => {
    const req = new NextRequest("http://localhost/api/badge", {
      method: "POST",
      body: JSON.stringify({
        score: {
          score: 100,
          grade: "A",
          label: "Perfect",
          color: "#b087f9",
          totalViolations: 0,
          breakdown: [],
          affectedFiles: [],
        },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<svg");
  });

  it("GET returns default badge SVG", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<svg");
  });
});
