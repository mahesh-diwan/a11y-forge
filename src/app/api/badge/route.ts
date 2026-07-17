import { NextRequest, NextResponse } from "next/server";
import { generateBadge } from "@/lib/badge";
import type { ScoreResult } from "@/lib/types";
import { guardAndParse } from "@/lib/request-guard";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError } from "@/lib/errors";

async function handlePost(req: NextRequest) {
  const parsed = await guardAndParse<{ score?: ScoreResult }>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const { score } = parsed.data;
  if (!score || typeof score.score !== "number") {
    throw new ValidationError("Invalid score data", { category: "" });
  }
  const svg = generateBadge(score);
  return new NextResponse(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}

export const POST = withErrorHandler(handlePost);

export async function GET() {
  const start = Date.now();
  const defaultScore: ScoreResult = {
    score: 0, grade: "?", label: "Not scanned", color: "#6b7280",
    totalViolations: 0, breakdown: [], affectedFiles: [],
  };
  const svg = generateBadge(defaultScore);
  const r = new NextResponse(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
  return r;
}
