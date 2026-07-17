import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "./lib/security-headers";
import { MemoryRateLimiter } from "./lib/rate-limit";

const limiter = new MemoryRateLimiter();

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const headers = buildSecurityHeaders(process.env.NODE_ENV ?? "development");
  headers.forEach((v: string, k: string) => res.headers.set(k, v));

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const r = limiter.check(ip);
  res.headers.set("X-RateLimit-Remaining", String(r.remaining));
  if (!r.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      },
      { status: 429, headers: { "Retry-After": String(r.resetAfter) } },
    );
  }
  return res;
}

export const config = { matcher: ["/api/:path*"] };
