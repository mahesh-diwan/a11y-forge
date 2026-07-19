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
  it("development mode includes 'unsafe-eval' in CSP", () => {
    const h = buildSecurityHeaders("development");
    expect(h.get("Content-Security-Policy")).toContain("unsafe-eval");
  });
  it("production mode omits 'unsafe-eval' in CSP", () => {
    const h = buildSecurityHeaders("production");
    expect(h.get("Content-Security-Policy")).not.toContain("unsafe-eval");
  });
  it("production mode has HSTS with max-age and includeSubDomains", () => {
    const h = buildSecurityHeaders("production");
    const hsts = h.get("Strict-Transport-Security")!;
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
  });
  it("sets Referrer-Policy and Permissions-Policy", () => {
    const h = buildSecurityHeaders("production");
    expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });
  it("script-src includes unsafe-inline for Next.js compatibility", () => {
    const h = buildSecurityHeaders("production", "abc123");
    const csp = h.get("Content-Security-Policy")!;
    const scriptSrc = csp.match(/script-src[^;]+/)?.[0] ?? "";
    expect(scriptSrc).toContain("unsafe-inline");
  });
});
