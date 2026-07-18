import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "./lib/security-headers";
import { MemoryRateLimiter } from "./lib/rate-limit";

const limiter = new MemoryRateLimiter();

function applySecurityHeaders(res: NextResponse, env: string) {
  const headers = buildSecurityHeaders(env);
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
