import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { MODEL } from "@/lib/model";
import type { Violation, FixGroup } from "@/lib/types";
import { metaFor } from "@/lib/violation-meta";
import { guardAndParse } from "@/lib/request-guard";
import { prioritizeSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError } from "@/lib/errors";

function fallbackGroup(violations: Violation[]): FixGroup[] {
  const groups = new Map<string, Violation[]>();
  for (const v of violations) {
    const existing = groups.get(v.type) || [];
    existing.push(v);
    groups.set(v.type, existing);
  }

  return Array.from(groups.entries())
    .sort((a, b) => metaFor(a[0]).sortOrder - metaFor(b[0]).sortOrder)
    .map(([type, violations]) => ({
      category: metaFor(type).displayName,
      reasoning: metaFor(type).srViolation,
      violations,
    }));
}

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<{ violations?: Violation[]; consentToAi?: boolean }>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const zod = prioritizeSchema.safeParse(parsed.data);
  if (!zod.success)
    throw new ValidationError("Invalid request body", zod.error.flatten());
  const violations = zod.data.violations as unknown as Violation[];
  const consentToAi = zod.data.consentToAi;

  if (!violations || violations.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Group these WCAG violations into fix categories.

Rules:
- Group similar violation types together
- Order groups by user impact (critical first)
- For each group, provide reasoning explaining impact

Violations:
${JSON.stringify(violations, null, 2)}

Respond JSON: { "groups": [{ "category": string, "reasoning": string, "violationIndices": number[] }] }`;

      const openai = await getOpenAI();
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }, { signal: AbortSignal.timeout(15_000), timeout: 15_000 });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed: unknown = JSON.parse(content);
        const raw = (parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>).groups || parsed : []) as Array<Record<string, unknown>>;
        const groups = (Array.isArray(raw) ? raw : [])
          .filter((g) => g && typeof g === "object" && typeof g.category === "string" && Array.isArray(g.violationIndices))
          .map((g) => ({
            category: g.category as string,
            reasoning: typeof g.reasoning === "string" ? g.reasoning : "",
            violations: (g.violationIndices as number[])
              .filter((i: number) => typeof i === "number" && i >= 0 && i < violations.length)
              .map((i: number) => violations[i]),
          }))
          .filter((g) => g.violations.length > 0);
        if (groups.length > 0) {
          return NextResponse.json({ groups });
        }
      }
    } catch {
      // fallback to deterministic grouping
    }
  }

  const groups = fallbackGroup(violations);
  return NextResponse.json({ groups });
}

export const POST = withErrorHandler(handle);
