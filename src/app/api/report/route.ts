import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/report";
import { guardAndParse } from "@/lib/request-guard";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError, ScanError } from "@/lib/errors";

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<Record<string, unknown>>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const data = parsed.data as unknown as Parameters<typeof generateReport>[0];
  const html = generateReport(data);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="a11y-report-${Date.now()}.html"`,
    },
  });
}

export const POST = withErrorHandler(handle);
