import { describe, it, expect } from "vitest";
import { buildSecurityHeaders } from "./security-headers";

describe("security-headers", () => {
  it("sets CSP + frame-deny + nosniff", () => {
    const h = buildSecurityHeaders("production");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(h.get("Strict-Transport-Security")).toContain("max-age");
  });
  it("omits HSTS in dev", () => {
    const h = buildSecurityHeaders("development");
    expect(h.get("Strict-Transport-Security")).toBeNull();
  });
});
