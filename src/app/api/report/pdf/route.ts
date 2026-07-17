import { NextRequest, NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdf";
import type { ScanResult } from "@/lib/types";
import { guardAndParse } from "@/lib/request-guard";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError, ScanError } from "@/lib/errors";

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<ScanResult>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const data = parsed.data;
  if (!data || !data.score) {
    throw new ValidationError("Invalid report payload", { category: "" });
  }
  const pdf = await generatePdfReport(data);
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="a11y-report-${Date.now()}.pdf"`,
    },
  });
}

export const POST = withErrorHandler(handle);
