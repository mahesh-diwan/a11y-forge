import { describe, it, expect, vi } from "vitest";
import { scanRepo, CHECKS } from "./scanner";
import { coalesce } from "./coalesce";

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
