import { describe, it, expect } from "vitest";
import { checkKeyboardTrap, checkTabindex } from "@/lib/keyboard";

describe("checkKeyboardTrap", () => {
  it("flags dialog without aria-modal", () => {
    const v = checkKeyboardTrap('<div role="dialog"><p>hi</p></div>', "a.html");
    expect(v.some((x) => x.type === "missing-aria-modal")).toBe(true);
  });

  it("ignores dialog with aria-modal", () => {
    const v = checkKeyboardTrap('<div role="dialog" aria-modal="true"><p>hi</p></div>', "a.html");
    expect(v.some((x) => x.type === "missing-aria-modal")).toBe(false);
  });

  it("flags dialog without escape handler", () => {
    const v = checkKeyboardTrap('<div role="dialog"><p>hi</p></div>', "a.html");
    expect(v.some((x) => x.type === "missing-escape-handler")).toBe(true);
  });
});

describe("checkTabindex", () => {
  it("flags positive tabindex", () => {
    const v = checkTabindex('<div tabindex="3">x</div>', "a.html");
    expect(v).toHaveLength(1);
    expect(v[0].type).toBe("positive-tabindex");
  });

  it("ignores tabindex 0 and -1", () => {
    expect(checkTabindex('<div tabindex="0">x</div>', "a.html")).toHaveLength(0);
    expect(checkTabindex('<div tabindex="-1">x</div>', "a.html")).toHaveLength(0);
  });

  it("returns empty when no tabindex", () => {
    expect(checkTabindex("<div>x</div>", "a.html")).toHaveLength(0);
  });
});
