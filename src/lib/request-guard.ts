import { NextRequest, NextResponse } from "next/server";
import { sharedLimiter as limiter } from "./rate-limit";

const MAX_BODY_BYTES = 500_000;
const MAX_PAYLOAD_BYTES = 2_000_000;

export function guard(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = limiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." } },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const cl = req.headers.get("content-length");
  if (cl && parseInt(cl, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds size limit." } },
      { status: 413 }
    );
  }

  return null;
}

export async function guardAndParse<T>(req: NextRequest): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  const g = guard(req);
  if (g) return { data: null, error: g };

  let body: T;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return { data: null, error: NextResponse.json(
        { error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds size limit." } },
        { status: 413 }
      )};
    }
    body = JSON.parse(text) as T;
  } catch {
    return { data: null, error: NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON in request body." } },
      { status: 400 }
    )};
  }

  return { data: body, error: null };
}
