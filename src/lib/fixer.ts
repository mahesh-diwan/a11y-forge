import type { FixGroup } from "./types";
import { getOpenAI } from "./openai";

/**
 * Interface for auto-fix strategies.
 *
 * Why: Supports pluggable fixers — regex-based for simple pattern fixes,
 * GPT-based for complex fixes. Each fixer produces corrected file content
 * for a given FixGroup of violations.
 *
 * @param name - Human-readable fixer identifier (e.g. "regex", "gpt").
 * @param generate - Produces corrected file contents for violations in group.
 */
export interface Fixer {
  readonly name: string;
  generate(files: Record<string, string>, group: FixGroup, signal?: AbortSignal): Promise<Record<string, string>>;
}

const MODEL = "gpt-5.6";
const TIMEOUT_MS = 30_000;

function addIfMissing(tag: string, attr: string): string {
  return new RegExp(attr.split("=")[0] + "\\s*=", "i").test(tag)
    ? tag
    : tag.replace(/>$/, ` ${attr}>`);
}

const REGEX_FIXERS: Record<string, (content: string) => string> = {
  "missing-alt-text": (c) =>
    c.replace(/<img[^>]*>/gi, (m) => addIfMissing(m, 'alt="descriptive image"')),
  "missing-aria-label": (c) =>
    c.replace(/<button[^>]*>/gi, (m) => addIfMissing(m, 'aria-label="action"')),
  "missing-form-label": (c) =>
    c.replace(/<(input|select|textarea)[^>]*>/gi, (m) => addIfMissing(m, 'aria-label="field"')),
  "missing-html-lang": (c) => c.replace(/<html(?![^>]*\slang=)/i, '<html lang="en"'),
};

/**
 * Regex-based fixer for simple pattern violations.
 *
 * Why: Covers common, unambiguous violations (missing alt, aria-label, lang)
 * with predictable regex replacements. No API call needed. Used as fallback
 * when GPT fixer fails or times out.
 */
export class RegexFixer implements Fixer {
  readonly name = "regex";
  async generate(files: Record<string, string>, group: FixGroup): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const v of group.violations) {
      const fix = REGEX_FIXERS[v.type];
      if (fix && files[v.file]) {
        out[v.file] = fix(out[v.file] ?? files[v.file]);
      }
    }
    return out;
  }
}

/**
 * AI-powered fixer using GPT for complex accessibility fixes.
 *
 * Why: Handles violations requiring understanding of context — e.g. generating
 * meaningful alt text from image src, or restructuring headings. Falls back
 * to RegexFixer if GPT call fails or returns empty. Uses JSON response format
 * for reliable parsing. Respects AbortSignal for cancellation.
 */
export class GptFixer implements Fixer {
  readonly name = "gpt";
  async generate(files: Record<string, string>, group: FixGroup, signal?: AbortSignal): Promise<Record<string, string>> {
    const openai = await getOpenAI();
    const prompt = `You are an accessibility fixer. Generate corrected code for these WCAG violations.

For each file, output the FULL corrected file content. Keep the original code but apply the fixes.

Violations:
${JSON.stringify(group.violations, null, 2)}

Current file contents:
${JSON.stringify(files, null, 2)}

Respond with JSON: { "files": { "path/to/file.tsx": "corrected content", ... } }`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }, { signal, timeout: TIMEOUT_MS });

    const content = response.choices[0]?.message?.content;
    if (!content) return {};
    const parsed: unknown = JSON.parse(content);
    if (parsed && typeof parsed === "object" && "files" in parsed && typeof (parsed as Record<string, unknown>).files === "object") {
      return (parsed as Record<string, unknown>).files as Record<string, string>;
    }
    return {};
  }
}

/**
 * Composable fallback fixer — tries primary, falls back to secondary on failure.
 *
 * Why: Encapsulates try-primary-then-fallback pattern as a Fixer.
 * usedFallback flag lets callers know whether primary or fallback was used.
 * Enable testing fallback logic independently with fake fixers.
 */
export class FallbackFixer implements Fixer {
  readonly name = "fallback";
  usedFallback = false;
  constructor(private primary: Fixer, private fallback: Fixer) {}
  async generate(files: Record<string, string>, group: FixGroup, signal?: AbortSignal): Promise<Record<string, string>> {
    this.usedFallback = false;
    try {
      const result = await this.primary.generate(files, group, signal);
      if (Object.keys(result).length > 0) return result;
    } catch { /* fall through */ }
    this.usedFallback = true;
    return this.fallback.generate(files, group);
  }
}

/**
 * Generate auto-fixes for a group of violations.
 *
 * Why: Uses FallbackFixer to compose GPT (primary) + regex (fallback).
 * Returns usedFallback flag so callers can log or adjust explanation.
 *
 * @param files - Original file contents keyed by file path.
 * @param group - Violation group to fix.
 * @param signal - Optional AbortSignal to cancel GPT request.
 * @returns Corrected file contents and whether regex fallback was used.
 */
export async function generateFixes(
  files: Record<string, string>,
  group: FixGroup,
  signal?: AbortSignal
): Promise<{ files: Record<string, string>; usedFallback: boolean }> {
  const fixer = new FallbackFixer(new GptFixer(), new RegexFixer());
  const result = await fixer.generate(files, group, signal);
  return { files: result, usedFallback: fixer.usedFallback };
}
