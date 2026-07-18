import { describe, it, expect, afterEach, vi } from "vitest";
import { POST } from "@/app/api/scan/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/scanner", () => ({
  scanRepo: vi.fn(async () => ({
    violations: [
      { type: "missing-alt-text", file: "a.html", line: 1, description: "no alt" },
    ],
    fileCount: 1,
  })),
  computeCoverage: vi.fn(() => ({ fileCount: 1, categories: ["images"], scopeLimited: [], skipped: [] })),
}));

describe("/api/scan integration", () => {
  const saved = process.env.GITHUB_TOKEN;
  afterEach(() => {
    if (saved === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = saved;
  });

  it("returns 400 for invalid URL", async () => {
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://gitlab.com/x/y" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 500 when GITHUB_TOKEN missing", async () => {
    delete process.env.GITHUB_TOKEN;
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://github.com/owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CONFIG_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 200 with results when token present", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://github.com/owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.repoUrl).toBe("https://github.com/owner/repo");
    expect(body.violations.length).toBeGreaterThan(0);
    expect(body.score).toBeDefined();
  });
});
