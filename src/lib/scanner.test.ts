import { describe, it, expect, vi } from "vitest";
import { scanRepo, CHECKS, computeCoverage } from "./scanner";
import { coalesce } from "./coalesce";
import type { Violation } from "./types";

function makeOctokit(files: { path: string; content: string }[]) {
  const map = new Map(files.map((f) => [f.path, f.content]));
  return {
    rest: {
      git: {
        getRef: vi.fn(async () => ({ data: { object: { sha: "abc123" } } })),
        getTree: vi.fn(async () => ({
          data: {
            tree: files.map((f) => ({ type: "blob", path: f.path })),
          },
        })),
      },
    },
    // fetchFile is called directly via mocked github module
  } as any;
}

// Mock github so fetchFile reads from our in-memory map
vi.mock("./github", () => {
  const store = new Map<string, string>();
  return {
    getOctokit: vi.fn(() => ({}) as any),
    parseGithubUrl: (url: string) => {
      const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      return m ? { owner: m[1], repo: m[2] } : null;
    },
    fetchFile: vi.fn(async (_o: any, _ow: string, _re: string, path: string) => {
      return store.get(path) ?? "<img src=x.png>";
    }),
  };
});

describe("scanner.scanRepo", () => {
  it("scans files and detects violations", async () => {
    const octokit = makeOctokit([
      { path: "a.html", content: "<img src=x.png>" },
      { path: "b.tsx", content: "<button onClick={fn}></button>" },
    ]);
    const { violations, fileCount } = await scanRepo(
      "https://github.com/owner/repo",
      "token",
      octokit,
    );
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.type === "missing-alt-text")).toBe(true);
    expect(fileCount).toBe(2);
  });

  it("returns empty for repo with no relevant files", async () => {
    const octokit = makeOctokit([{ path: "README.md", content: "# hi" }]);
    const { violations } = await scanRepo(
      "https://github.com/owner/repo",
      "token",
      octokit,
    );
    expect(violations).toEqual([]);
  });

  it("caps files at 150 (MAX_FILES)", async () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      path: `f${i}.html`,
      content: "<img src=x.png>",
    }));
    const octokit = makeOctokit(many);
    const { violations } = await scanRepo(
      "https://github.com/owner/repo",
      "token",
      octokit,
    );
    expect(violations.length).toBeLessThanOrEqual(150);
  });

  it("coalesces concurrent identical scans", async () => {
    const octokit = makeOctokit([{ path: "a.html", content: "<img src=x.png>" }]);
    const [a, b] = await Promise.all([
      scanRepo("https://github.com/owner/repo", "t", octokit),
      scanRepo("https://github.com/owner/repo", "t", octokit),
    ]);
    expect(a.violations).toEqual(b.violations);
  });
});

describe("scanner CHECKS registry", () => {
  it("exposes html and jsx checks", () => {
    expect(CHECKS.length).toBeGreaterThan(0);
    expect(CHECKS.every((c) => typeof c.run === "function")).toBe(true);
  });
});

function runCheck(type: string, content: string, file: string) {
  const check = CHECKS.find((c) => c.type === type);
  return check ? check.run(content, file) : [];
}

describe("scanner regex detectors", () => {
  it("flags img without alt", () => {
    const v = runCheck("missing-alt-text", '<img src="x.png">', "a.html");
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe("missing-alt-text");
  });
  it("ignores img with alt", () => {
    expect(runCheck("missing-alt-text", '<img src="x.png" alt="hi">', "a.html")).toHaveLength(0);
  });
  it("flags button without text or aria-label", () => {
    const v = runCheck("missing-aria-label", "<button onClick={fn}></button>", "a.tsx");
    expect(v.some((x) => x.type === "missing-aria-label")).toBe(true);
  });
  it("flags input without id or aria", () => {
    const v = runCheck("missing-form-label", '<input type="text">', "a.html");
    expect(v.some((x) => x.type === "missing-form-label")).toBe(true);
  });
  it("flags html without lang", () => {
    const v = runCheck("missing-html-lang", "<html><body></body></html>", "index.html");
    expect(v.some((x) => x.type === "missing-html-lang")).toBe(true);
  });
  it("skips non-html files", () => {
    expect(runCheck("missing-html-lang", "<html><body></body></html>", "app.tsx")).toHaveLength(0);
  });
  it("passes when lang attribute present", () => {
    expect(runCheck("missing-html-lang", '<html lang="en"><body></body></html>', "index.html")).toHaveLength(0);
  });
  it("passes when no html tag", () => {
    expect(runCheck("missing-html-lang", "<body></body>", "page.html")).toHaveLength(0);
  });
  it("handles .html file without lang", () => {
    expect(runCheck("missing-html-lang", "<html><body></body></html>", "page.html")).toHaveLength(1);
  });
  it("skips .htm files", () => {
    expect(runCheck("missing-html-lang", "<html><body></body></html>", "page.htm")).toHaveLength(0);
  });
});

describe("computeCoverage", () => {
  it("maps categories from violations", () => {
    const v: Violation[] = [
      { type: "missing-alt-text", file: "a.html", line: 1, description: "x" },
      { type: "low-contrast", file: "b.html", line: 2, description: "x" },
    ];
    const r = computeCoverage(2, v);
    expect(r.categories).toEqual(["contrast", "images"]);
    expect(r.fileCount).toBe(2);
  });
  it("identifies scope-limited types", () => {
    const v: Violation[] = [
      { type: "low-contrast", file: "a.html", line: 1, description: "x" },
      { type: "keyboard-trap", file: "b.html", line: 2, description: "x" },
    ];
    const r = computeCoverage(2, v);
    expect(r.scopeLimited).toEqual(["keyboard-trap", "low-contrast"]);
    expect(r.skipped).toEqual([]);
  });
  it("returns empty arrays for no violations", () => {
    const r = computeCoverage(0, []);
    expect(r.categories).toEqual([]);
    expect(r.scopeLimited).toEqual([]);
    expect(r.skipped).toEqual([]);
  });
  it("maps unknown violation types to other", () => {
    const v: Violation[] = [
      { type: "unknown-type", file: "a.html", line: 1, description: "x" },
    ];
    const r = computeCoverage(1, v);
    expect(r.categories).toEqual(["other"]);
  });
  it("filters SCOPE_LIMITED_TYPES to only those present", () => {
    const v: Violation[] = [
      { type: "low-contrast", file: "a.html", line: 1, description: "x" },
      { type: "missing-alt-text", file: "b.html", line: 2, description: "x" },
    ];
    const r = computeCoverage(2, v);
    expect(r.scopeLimited).toEqual(["low-contrast"]);
    expect(r.categories).toContain("images");
  });
});

describe("coalesce", () => {
  it("dedupes concurrent calls", async () => {
    const fn = vi.fn(async () => "result");
    const [a, b] = await Promise.all([coalesce("k", fn), coalesce("k", fn)]);
    expect(a).toBe("result");
    expect(b).toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
