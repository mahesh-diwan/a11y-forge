import { describe, it, expect, afterEach, vi } from "vitest";
import { POST } from "@/app/api/prioritize/route";
import { NextRequest } from "next/server";

const savedKey = process.env.OPENAI_API_KEY;
afterEach(() => {
  if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = savedKey;
});

vi.mock("@/lib/openai", () => ({
  getOpenAI: vi.fn(async () => ({
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  groups: [
                    {
                      category: "Images",
                      reasoning: "alt text matters",
                      violationIndices: [0],
                    },
                  ],
                }),
              },
            },
          ],
        })),
      },
    },
  })),
}));

describe("/api/prioritize integration", () => {
  it("returns 400 when consent missing", async () => {
    const req = new NextRequest("http://localhost/api/prioritize", {
      method: "POST",
      body: JSON.stringify({
        violations: [{ type: "missing-alt-text", file: "a.html", line: 1 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost/api/prioritize", {
      method: "POST",
      body: JSON.stringify({ consentToAi: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns grouped results with consent (fallback)", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = new NextRequest("http://localhost/api/prioritize", {
      method: "POST",
      body: JSON.stringify({
        consentToAi: true,
        violations: [
          { type: "missing-alt-text", file: "a.html", line: 1 },
          { type: "missing-aria-label", file: "b.tsx", line: 2 },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.groups)).toBe(true);
    expect(body.groups.length).toBeGreaterThan(0);
  });

  it("uses OpenAI grouping when API key present", async () => {
    process.env.OPENAI_API_KEY = "sk_test";
    const req = new NextRequest("http://localhost/api/prioritize", {
      method: "POST",
      body: JSON.stringify({
        consentToAi: true,
        violations: [
          { type: "missing-alt-text", file: "a.html", line: 1 },
          { type: "missing-aria-label", file: "b.tsx", line: 2 },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.groups)).toBe(true);
    expect(body.groups.length).toBeGreaterThan(0);
  });
});
