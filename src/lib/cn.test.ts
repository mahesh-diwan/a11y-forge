import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsey values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns empty for no args", () => {
    expect(cn()).toBe("");
  });

  it("returns empty for all falsey", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});
