import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { guard, guardAndParse } from "./request-guard";

describe("request-guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("passes valid small request", async () => {
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://github.com/o/r" }),
    });
    const g = guard(req);
    expect(g).toBeNull();
    const parsed = await guardAndParse<{ repoUrl: string }>(req);
    expect(parsed.error).toBeNull();
    expect(parsed.data!.repoUrl).toBe("https://github.com/o/r");
  });

  it("blocks oversized content-length", () => {
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      headers: { "content-length": String(3_000_000) },
      body: "{}",
    });
    const g = guard(req);
    expect(g?.status).toBe(413);
  });

  it("returns INVALID_JSON for bad body", async () => {
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: "{not json",
    });
    const parsed = await guardAndParse(req);
    expect(parsed.error).not.toBeNull();
    const body = await parsed.error!.json();
    expect(body.error.code).toBe("INVALID_JSON");
  });

  it("rate limits after many requests", () => {
    const req = () =>
      new NextRequest("http://localhost/api/x", {
        method: "POST",
        headers: { "x-forwarded-for": "9.9.9.9" },
        body: "{}",
      });
    let blocked = false;
    for (let i = 0; i < 30; i++) {
      const g = guard(req());
      if (g && g.status === 429) blocked = true;
    }
    expect(blocked).toBe(true);
  });
});
