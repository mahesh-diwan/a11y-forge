import { describe, it, expect, vi } from "vitest";
import { RegexFixer, GptFixer, FallbackFixer, KNOWN_VIOLATION_TYPES, attributeForType, applyEdit, generateFixes } from "./fixer";
import type { FixGroup } from "./types";

function sampleGroup(overrides?: Partial<FixGroup>): FixGroup {
  return {
    category: "alt",
    reasoning: "images need alt text",
    violations: [{ type: "missing-alt-text", file: "a.html", line: 1, description: "Image missing alt" }],
    ...overrides,
  };
}

describe("KNOWN_VIOLATION_TYPES", () => {
  it("includes all expected violation types", () => {
    expect(KNOWN_VIOLATION_TYPES.has("missing-alt-text")).toBe(true);
    expect(KNOWN_VIOLATION_TYPES.has("missing-aria-label")).toBe(true);
    expect(KNOWN_VIOLATION_TYPES.has("unknown-bogus")).toBe(false);
  });
});

describe("attributeForType", () => {
  it("returns expected attribute for known types", () => {
    expect(attributeForType("missing-alt-text")).toBe("alt");
    expect(attributeForType("missing-aria-label")).toBe("aria-label");
    expect(attributeForType("missing-form-label")).toBe("aria-label");
    expect(attributeForType("missing-html-lang")).toBe("lang");
    expect(attributeForType("iframe-no-title")).toBe("title");
    expect(attributeForType("low-contrast")).toBeNull();
  });
});

describe("applyEdit", () => {
  it("adds attribute to single-line HTML tag", () => {
    const result = applyEdit('<img src="x.png">', 1, "alt", "description");
    expect(result).toBe('<img src="x.png" alt="description">');
  });

  it("adds attribute to self-closing tag", () => {
    const result = applyEdit('<img src="x.png" />', 1, "alt", "desc");
    expect(result).toContain('alt="desc"');
  });

  it("does nothing if attribute already exists", () => {
    const input = '<img src="x.png" alt="existing">';
    const result = applyEdit(input, 1, "alt", "new");
    expect(result).toBe(input);
  });

  it("handles multi-line JSX tag", () => {
    const input = `<button
  onClick={handleClick}
  style={{ color: "red" }}>
  Click
</button>`;
    const result = applyEdit(input, 1, "aria-label", "Submit");
    expect(result).toContain('aria-label="Submit"');
    expect(result).toContain("onClick={handleClick}");
  });

  it("preserves content outside edit region", () => {
    const input = '<div>before</div>\n<img src="x.png">\n<div>after</div>';
    const result = applyEdit(input, 2, "alt", "desc");
    expect(result).toContain("before");
    expect(result).toContain("after");
    expect(result).toContain('alt="desc"');
  });

  it("escapes double quotes in value", () => {
    const result = applyEdit('<img src="x.png">', 1, "alt", 'say "hello"');
    expect(result).toContain('alt="say &quot;hello&quot;"');
  });
});

describe("RegexFixer", () => {
  it("adds alt to img tags", async () => {
    const fixer = new RegexFixer();
    const files = { "a.html": '<img src="x.png">' };
    const result = await fixer.generate(files, sampleGroup());
    expect(result["a.html"]).toContain('alt="descriptive image"');
  });

  it("adds aria-label to button tags", async () => {
    const fixer = new RegexFixer();
    const group = sampleGroup({ violations: [{ type: "missing-aria-label", file: "b.html", line: 1, description: "btn missing label" }] });
    const result = await fixer.generate({ "b.html": "<button>btn</button>" }, group);
    expect(result["b.html"]).toContain('aria-label="action"');
  });
});

describe("GptFixer structured validation (unit, no API)", () => {
  function mockFixer(edits: unknown[]): GptFixer {
    const fakeGetOpenAI = () => ({
      chat: { completions: { create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ edits }) } }],
      }) } },
    } as any);
    // Pass getOpenAI factory via constructor
    return new GptFixer(fakeGetOpenAI);
  }

  it("rejects edits for unknown attribute types", async () => {
    const fixer = mockFixer([
      { file: "a.html", line: 1, attribute: "onclick", action: "add", value: "evil()" },
    ]);
    const result = await fixer.generate({ "a.html": '<img src="x.png">' }, sampleGroup());
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("rejects edits for files not in violation group", async () => {
    const fixer = mockFixer([
      { file: "outside.html", line: 1, attribute: "alt", action: "add", value: "desc" },
    ]);
    const result = await fixer.generate({ "outside.html": '<img src="x.png">' }, sampleGroup());
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("rejects edits with excessively long value (>500)", async () => {
    const fixer = mockFixer([
      { file: "a.html", line: 1, attribute: "alt", action: "add", value: "x".repeat(501) },
    ]);
    const result = await fixer.generate({ "a.html": '<img src="x.png">' }, sampleGroup());
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("accepts valid structured edits", async () => {
    const fixer = mockFixer([
      { file: "a.html", line: 1, attribute: "alt", action: "add", value: "a photo" },
    ]);
    const result = await fixer.generate({ "a.html": '<img src="x.png">' }, sampleGroup());
    expect(result["a.html"]).toContain('alt="a photo"');
  });
});

describe("FallbackFixer", () => {
  it("falls back to secondary when primary returns empty", async () => {
    const primary = { name: "empty", generate: vi.fn().mockResolvedValue({}) };
    const secondary = new RegexFixer();
    const fixer = new FallbackFixer(primary, secondary);
    const files = { "a.html": '<img src="x.png">' };
    const result = await fixer.generate(files, sampleGroup());
    expect(result["a.html"]).toContain('alt="descriptive image"');
    expect(fixer.usedFallback).toBe(true);
  });

  it("uses primary result when non-empty", async () => {
    const primary = { name: "primary", generate: vi.fn().mockResolvedValue({ "a.html": '<img alt="from primary">' }) };
    const secondary = new RegexFixer();
    const fixer = new FallbackFixer(primary, secondary);
    const result = await fixer.generate({ "a.html": '<img src="x.png">' }, sampleGroup());
    expect(result["a.html"]).toContain("from primary");
    expect(fixer.usedFallback).toBe(false);
  });
});
