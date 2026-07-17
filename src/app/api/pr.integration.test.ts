import { describe, it, expect, afterEach, vi } from "vitest";
import { POST } from "@/app/api/pr/route";
import { NextRequest } from "next/server";

const fakeOctokit = {
  rest: {
    repos: {
      get: vi.fn(async () => ({ data: { default_branch: "main" } })),
      getBranch: vi.fn(async () => ({ data: { commit: { sha: "baseSha" } } })),
    },
    git: {
      getRef: vi.fn(async () => {
        throw new Error("no branch yet");
      }),
      createRef: vi.fn(async () => ({ data: {} })),
      createBlob: vi.fn(async () => ({ data: { sha: "blobSha" } })),
      createTree: vi.fn(async () => ({ data: { sha: "treeSha" } })),
      createCommit: vi.fn(async () => ({ data: { sha: "commitSha" } })),
      updateRef: vi.fn(async () => ({ data: {} })),
    },
    pulls: {
      create: vi.fn(async () => ({
        data: { html_url: "https://github.com/o/r/pull/1", number: 1 },
      })),
    },
  },
} as any;

vi.mock("@/lib/github", () => ({
  getOctokit: vi.fn(() => fakeOctokit),
  parseGithubUrl: (url: string) => {
    const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    return m ? { owner: m[1], repo: m[2] } : null;
  },
  fetchFile: vi.fn(async (_o: any, _ow: string, _re: string, path: string) =>
    path === "a.html" ? '<img src="x.png">' : "",
  ),
}));

describe("/api/pr integration", () => {
  const saved = process.env.GITHUB_TOKEN;
  afterEach(() => {
    if (saved === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = saved;
  });

  it("returns 400 for invalid repo URL", async () => {
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://gitlab.com/o/r",
        group: { category: "alt", violations: [{ type: "x", file: "a.html", line: 1 }] },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 500 when GITHUB_TOKEN missing", async () => {
    delete process.env.GITHUB_TOKEN;
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/owner/repo",
        group: { category: "alt", violations: [{ type: "x", file: "a.html", line: 1 }] },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CONFIG_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns diffs on dryRun with valid group (fallback fixes)", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    delete process.env.OPENAI_API_KEY;
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/owner/repo",
        dryRun: true,
        group: {
          category: "alt",
          violations: [{ type: "missing-alt-text", file: "a.html", line: 1 }],
        },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dryRun).toBe(true);
    expect(body.fixCount).toBeGreaterThan(0);
    expect(Array.isArray(body.diffs)).toBe(true);
  });

  it("returns 400 for invalid fix group", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/owner/repo",
        group: { category: "", violations: [] },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 400 when repo not accessible", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    fakeOctokit.rest.repos.get.mockRejectedValueOnce(new Error("not found"));
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/owner/repo",
        group: { category: "alt", violations: [{ type: "x", file: "a.html", line: 1 }] },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("returns 400 for schema-invalid payload", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://github.com/owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("creates PR on non-dryRun with valid group (fallback fixes)", async () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    delete process.env.OPENAI_API_KEY;
    const req = new NextRequest("http://localhost/api/pr", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/owner/repo",
        dryRun: false,
        group: {
          category: "alt",
          reasoning: "images need alt text",
          violations: [{ type: "missing-alt-text", file: "a.html", line: 1 }],
        },
        consentToAi: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("pull");
    expect(body.number).toBe(1);
    expect(body.fixCount).toBeGreaterThan(0);
  });
});
