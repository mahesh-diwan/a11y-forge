import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "./lib/security-headers";

function nonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function proxy(req: NextRequest) {
  const n = nonce();
  const headers = buildSecurityHeaders(process.env.NODE_ENV ?? "development", n);
  const res = NextResponse.next();
  headers.forEach((v: string, k: string) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ["/((?!_next/static|favicon.ico).*)"] };
