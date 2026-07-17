import { describe, it, expect } from "vitest";
import { generateScreenReaderPreview } from "@/lib/screen-reader";
import type { Violation } from "@/lib/types";

const mk = (type: string, snippet?: string): Violation => ({
  type, file: "a.tsx", line: 1, description: type, snippet,
});

describe("generateScreenReaderPreview", () => {
  it("returns entry per violation", () => {
    const r = generateScreenReaderPreview([mk("missing-alt-text"), mk("low-contrast")]);
    expect(r).toHaveLength(2);
  });

  it("describes missing alt", () => {
    const r = generateScreenReaderPreview([mk("missing-alt-text")]);
    expect(r[0].current).toContain("no description");
    expect(r[0].fixed).toContain("Image");
  });

  it("describes missing aria label", () => {
    const r = generateScreenReaderPreview([mk("missing-aria-label")]);
    expect(r[0].current).toContain("unlabeled");
    expect(r[0].fixed).toContain("Button");
  });

  it("handles unknown violation type", () => {
    const r = generateScreenReaderPreview([mk("unknown-type")]);
    expect(r[0].element).toBe("unknown");
  });

  it("guesses alt text from src", () => {
    const r = generateScreenReaderPreview([mk("missing-alt-text", '<img src="photo.png">')]);
    expect(r[0].fixed).toContain("photo");
  });
});
