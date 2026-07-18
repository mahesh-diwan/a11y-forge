import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "./lib/security-headers";
import { sharedLimiter as limiter } from "./lib/rate-limit";

function nonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

function applySecurityHeaders(res: NextResponse, env: string) {
  const n = nonce();
  const headers = buildSecurityHeaders(env, n);
  headers.forEach((v: string, k: string) => res.headers.set(k, v));
  return res;
}

export function proxy(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const r = limiter.check(ip);

  if (!r.allowed) {
    const res = NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      },
      { status: 429, headers: { "Retry-After": String(r.resetAfter) } },
    );
    return applySecurityHeaders(res, process.env.NODE_ENV ?? "development");
  }

  const res = NextResponse.next();
  applySecurityHeaders(res, process.env.NODE_ENV ?? "development");
  res.headers.set("X-RateLimit-Remaining", String(r.remaining));
  return res;
}

export const config = { matcher: ["/api/:path*"] };
