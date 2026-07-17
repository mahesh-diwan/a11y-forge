import { NextRequest, NextResponse } from "next/server";
import { scanRepo } from "@/lib/scanner";
import { calculateScore } from "@/lib/score";
import { generateScreenReaderPreview } from "@/lib/screen-reader";
import { scoreConfidence } from "@/lib/confidence";
import { guardAndParse } from "@/lib/request-guard";
import { scanSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError, ConfigError, ScanError } from "@/lib/errors";

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<{ repoUrl?: string }>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const zod = scanSchema.safeParse(parsed.data);
  if (!zod.success)
    throw new ValidationError("Invalid repo URL", zod.error.flatten());
  const { repoUrl } = zod.data;

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new ConfigError("GITHUB_TOKEN not configured");

  const violations = await scanRepo(repoUrl, token);
  const score = calculateScore(violations);
  const screenReader = generateScreenReaderPreview(violations);
  const confidence = scoreConfidence(violations);

  return NextResponse.json({
    repoUrl,
    violations,
    score,
    screenReader,
    confidence,
  });
}

export const POST = withErrorHandler(handle);
