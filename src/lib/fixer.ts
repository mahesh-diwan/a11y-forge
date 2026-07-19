import type { FixGroup } from "./types";
import { getOpenAI } from "./openai";
import { MODEL } from "./model";
import { lineOf } from "./line-of";

/**
 * Interface for auto-fix strategies.
 */
export interface Fixer {
  readonly name: string;
  generate(files: Record<string, string>, group: FixGroup, signal?: AbortSignal): Promise<Record<string, string>>;
}

const TIMEOUT_MS = 30_000;

export function addIfMissing(tag: string, attr: string): string {
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
 * Known violation types — derived from CHECKS registry in scanner.ts.
 * Used by GptFixer to validate model output never introduces unknown types.
 */
export const KNOWN_VIOLATION_TYPES = new Set([
  "missing-alt-text", "missing-aria-label", "missing-form-label",
  "missing-html-lang", "low-contrast", "keyboard-trap", "positive-tabindex",
  "heading-structure", "vague-link-text", "iframe-no-title",
  "empty-alt-meaningful-img", "potential-contrast-issue", "missing-aria-modal",
  "missing-escape-handler",
]);

/**
 * Attribute derivation by violation type.
 */
export function attributeForType(type: string): string | null {
  const map: Record<string, string> = {
    "missing-alt-text": "alt",
    "missing-aria-label": "aria-label",
    "missing-form-label": "aria-label",
    "missing-html-lang": "lang",
    "iframe-no-title": "title",
    "positive-tabindex": "tabindex",
  };
  return map[type] ?? null;
}

/**
 * Apply a single attribute addition to matching tag on target line.
 * Handles single-line and multi-line JSX/HTML tags.
 * Only ever adds/changes the designated attribute — never touches other content.
 */
export function applyEdit(content: string, line: number, attribute: string, value: string): string {
  const lines = content.split("\n");
  const idx = Math.min(line - 1, lines.length - 1);
  if (idx < 0) return content;

  // Multi-line tag matcher: from a '<' start token to the corresponding '>'
  const searchFrom = Math.max(0, idx - 5);
  const searchTo = Math.min(lines.length - 1, idx + 5);
  const region = lines.slice(searchFrom, searchTo + 1).join("\n");

  // Find opening tags (start at '<word' and end at next '>' not inside string)
  const tagRe = /<(\w[\w.-]*)([\s\S]*?)>/g;
  let bestMatch: { full: string; attrs: string } | null = null;
  let bestOffset = Infinity;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(region)) !== null) {
    const tagLine = lineOf(region, m.index);
    const dist = Math.abs(tagLine - (line - searchFrom));
    if (dist < bestOffset) {
      bestOffset = dist;
      bestMatch = { full: m[0], attrs: m[2] };
    }
  }

  if (!bestMatch) return content;

  // If attribute already exists, skip (avoid duplication)
  if (new RegExp(`${attribute}\\s*=`, "i").test(bestMatch.attrs)) return content;

  const attrStr = `${attribute}="${value.replace(/"/g, "&quot;")}"`;

  if (bestMatch.full.endsWith("/>")) {
    // Self-closing: insert before />
    const fixed = bestMatch.full.slice(0, -2) + ` ${attrStr} />`;
    const regionFixed = region.replace(bestMatch.full, fixed);
    return lines.slice(0, searchFrom).join("\n") + "\n" + regionFixed + "\n" + lines.slice(searchTo + 1).join("\n");
  }

  // Opening tag: insert before the closing >
  const fixed = bestMatch.full.slice(0, -1) + ` ${attrStr}>`;
  const regionFixed = region.replace(bestMatch.full, fixed);
  const before = lines.slice(0, searchFrom).join("\n");
  const after = lines.slice(searchTo + 1).join("\n");
  const parts = [before, regionFixed, after].filter(Boolean);
  return parts.join("\n");
}

/** Max edits per file per fix group */
const MAX_EDITS_PER_FILE = 5;
/** Max total edits per group */
const MAX_EDITS_TOTAL = 20;

interface StructuredEdit {
  file: string;
  line: number;
  attribute: string;
  action: "add" | "replace";
  value: string;
}

/**
 * AI-powered fixer using GPT — returns structured edits only, never full file bodies.
 *
 * Security model:
 * - Model outputs targeted edits { file, line, attribute, action, value }
 * - Every edit is validated against KNOWN_VIOLATION_TYPES
 * - Attribute is derived from violation type, never trusted from model
 * - Edits are capped (5 per file, 20 per group)
 * - Uses addIfMissing/attribute-only insertion — never replaces full file
 * - Falls back to RegexFixer if validation/cap fails
 */
export class GptFixer implements Fixer {
  readonly name = "gpt";
  private getOpenAi: () => ReturnType<typeof getOpenAI>;

  constructor(getOpenAi?: () => ReturnType<typeof getOpenAI>) {
    this.getOpenAi = getOpenAi ?? getOpenAI;
  }

  async generate(files: Record<string, string>, group: FixGroup, signal?: AbortSignal): Promise<Record<string, string>> {
    const openai = await this.getOpenAi();

    const violationTypeKeys = [...new Set(group.violations.map((v) => v.type))];
    const validTypes = violationTypeKeys.filter((t) => KNOWN_VIOLATION_TYPES.has(t));
    if (validTypes.length === 0) return {};

    const allowedAttrs = [...new Set(validTypes.map((t) => attributeForType(t)).filter(Boolean))];

    const prompt = `You are an accessibility fixer. Generate targeted attribute edits to fix WCAG violations.

For each violation, output a single edit adding or replacing an accessibility attribute on the HTML/JSX element at the given line.

RULES:
- Only output edits for these attribute types: ${allowedAttrs.join(", ")}
- Each edit targets ONE attribute on ONE element — never full file content
- The line number approximately locates the element; nearby element is fine
- Generate descriptive, context-appropriate values for alt text, aria-label, etc. based on filenames and surrounding context

Violations:
${JSON.stringify(group.violations, null, 2)}

Respond JSON: { "edits": [{ "file": "path/to/file.tsx", "line": 42, "attribute": "alt", "action": "add", "value": "description of image" }] }`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }, { signal, timeout: TIMEOUT_MS });

    const content = response.choices[0]?.message?.content;
    if (!content) return {};
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== "object") return {};
    const raw = (parsed as Record<string, unknown>).edits;
    if (!Array.isArray(raw)) return {};

    const filesInGroup = new Set(group.violations.map((v) => v.file));
    const violationTypesByFile = new Map<string, Set<string>>();
    for (const v of group.violations) {
      if (!violationTypesByFile.has(v.file)) violationTypesByFile.set(v.file, new Set());
      violationTypesByFile.get(v.file)!.add(v.type);
    }

    // Validate every edit against known types and group scope
    const edits: StructuredEdit[] = [];
    const editCountByFile = new Map<string, number>();

    for (const e of raw) {
      if (typeof e !== "object" || e === null) continue;
      const rec = e as Record<string, unknown>;
      const f = String(rec.file ?? "");
      const line = Number(rec.line ?? 0);
      const attr = String(rec.attribute ?? "").toLowerCase();
      const action = String(rec.action ?? "");
      const value = String(rec.value ?? "");

      if (!filesInGroup.has(f)) continue;
      if (!Number.isInteger(line) || line < 1) continue;
      if (action !== "add" && action !== "replace") continue;
      if (value.length > 500) continue;

      const fileTypes = violationTypesByFile.get(f);
      if (!fileTypes) continue;
      const expectedAttr = [...fileTypes].map((t) => attributeForType(t)).find((a) => a === attr);
      if (!expectedAttr) continue;

      const count = (editCountByFile.get(f) ?? 0) + 1;
      editCountByFile.set(f, count);
      if (count > MAX_EDITS_PER_FILE) continue;

      edits.push({ file: f, line, attribute: expectedAttr, action: action as "add" | "replace", value });
      if (edits.length >= MAX_EDITS_TOTAL) break;
    }

    if (edits.length === 0) return {};

    // Apply edits to file contents
    const out: Record<string, string> = {};
    for (const edit of edits) {
      if (!out[edit.file]) out[edit.file] = files[edit.file] ?? "";
      if (!out[edit.file]) continue;
      out[edit.file] = applyEdit(out[edit.file], edit.line, edit.attribute, edit.value);
    }

    return out;
  }
}

/**
 * Composable fallback fixer — tries primary, falls back to secondary on failure.
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
