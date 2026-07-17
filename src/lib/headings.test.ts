import { describe, it, expect } from "vitest";
import { checkHeadings } from "@/lib/headings";

describe("checkHeadings", () => {
  it("passes well-structured headings", () => {
    const v = checkHeadings("<h1>Title</h1><h2>Section</h2><h3>Sub</h3>", "a.html");
    expect(v).toHaveLength(0);
  });

  it("flags page not starting with h1", () => {
    const v = checkHeadings("<h3>Late start</h3>", "a.html");
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe("heading-structure");
    expect(v[0].description).toContain("h3");
  });

  it("flags skipped heading level", () => {
    const v = checkHeadings("<h1>A</h1><h3>C</h3>", "a.html");
    expect(v).toHaveLength(1);
    expect(v[0].description).toContain("h3");
  });

  it("returns empty for no headings", () => {
    expect(checkHeadings("<p>text</p>", "a.html")).toHaveLength(0);
  });
});
