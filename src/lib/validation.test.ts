import { describe, it, expect } from "vitest";
import { scanSchema, prioritizeSchema, prSchema } from "./validation";

describe("scanSchema", () => {
  it("accepts valid GitHub URL", () => {
    const r = scanSchema.safeParse({ repoUrl: "https://github.com/owner/repo" });
    expect(r.success).toBe(true);
  });

  it("accepts URL with dots in name", () => {
    const r = scanSchema.safeParse({ repoUrl: "https://github.com/owner-org/repo-name" });
    expect(r.success).toBe(true);
  });

  it("rejects non-GitHub URL", () => {
    const r = scanSchema.safeParse({ repoUrl: "https://gitlab.com/owner/repo" });
    expect(r.success).toBe(false);
  });

  it("rejects empty repoUrl", () => {
    const r = scanSchema.safeParse({ repoUrl: "" });
    expect(r.success).toBe(false);
  });

  it("rejects missing repoUrl", () => {
    const r = scanSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

describe("prioritizeSchema", () => {
  it("accepts valid payload", () => {
    const r = prioritizeSchema.safeParse({
      violations: [{ type: "alt-text", file: "index.html", line: 5 }],
      consentToAi: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing consentToAi", () => {
    const r = prioritizeSchema.safeParse({
      violations: [{ type: "alt-text", file: "index.html", line: 5 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty violations", () => {
    const r = prioritizeSchema.safeParse({ violations: [], consentToAi: true });
    expect(r.success).toBe(false);
  });
});

describe("prSchema", () => {
  it("accepts valid payload", () => {
    const r = prSchema.safeParse({
      repoUrl: "https://github.com/owner/repo",
      group: { category: "alt-text", violations: [{ type: "alt-text", file: "a.html", line: 1 }] },
      consentToAi: true,
    });
    expect(r.success).toBe(true);
  });

  it("accepts dryRun", () => {
    const r = prSchema.safeParse({
      repoUrl: "https://github.com/owner/repo",
      group: { category: "alt-text", violations: [{ type: "alt-text", file: "a.html", line: 1 }] },
      dryRun: true,
      consentToAi: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing consentToAi", () => {
    const r = prSchema.safeParse({
      repoUrl: "https://github.com/owner/repo",
      group: { category: "alt-text", violations: [{ type: "alt-text", file: "a.html", line: 1 }] },
    });
    expect(r.success).toBe(false);
  });
});
