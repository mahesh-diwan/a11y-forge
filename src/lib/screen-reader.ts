import type { Violation } from "./types";
import { metaFor } from "./violation-meta";

interface ScreenReaderOutput {
  file: string;
  line: number;
  element: string;
  current: string;
  fixed: string;
  violation: string;
}

interface SrEntry {
  element: string;
  current: string;
  fixed: string | ((snippet: string) => string);
}

const SR_MAP: Record<string, SrEntry> = {
  "missing-alt-text":         { element: "<img>",     current: "[Image — no description available]",    fixed: (s) => `[Image — ${guessAltText(s)}]` },
  "missing-aria-label":       { element: "<button>",  current: "[Button — unlabeled]",                  fixed: (s) => `[Button — ${guessAriaLabel(s)}]` },
  "missing-form-label":       { element: "<input>",   current: "[Input field — unlabeled]",             fixed: (s) => `[Input field — ${guessInputLabel(s)}]` },
  "missing-html-lang":        { element: "<html>",    current: "[Page — unknown language]",             fixed: "[Page — English]" },
  "potential-contrast-issue": { element: "text",      current: "[Low contrast — hard to read]",         fixed: "[High contrast — readable]" },
  "low-contrast":             { element: "text",      current: "[Low contrast — fails WCAG AA]",        fixed: "[High contrast — passes 4.5:1]" },
  "missing-aria-modal":       { element: "<dialog>",  current: "[Modal open — background still read]",  fixed: "[Modal open — background hidden]" },
  "missing-escape-handler":   { element: "<dialog>",  current: "[Modal — no Escape to close]",          fixed: "[Modal — Escape closes it]" },
  "positive-tabindex":        { element: "focusable", current: "[Forced tab order]",                    fixed: "[Natural tab order]" },
  "heading-structure":        { element: "<heading>", current: "[Broken heading outline]",              fixed: "[Sequential heading outline]" },
  "vague-link-text":          { element: "<a>",       current: "[Link — 'click here']",                 fixed: "[Link — descriptive text]" },
  "iframe-no-title":          { element: "<iframe>",  current: "[Frame — unidentified]",                fixed: "[Frame — titled]" },
  "empty-alt-meaningful-img": { element: "<img>",     current: "[Image — hidden from SR]",              fixed: "[Image — described]" },
};

/** Fallback entry for unknown violation types. */
const SR_DEFAULT: SrEntry = {
  element: "unknown", current: "[Unknown issue]", fixed: "[Fixed]",
};

function describeViolation(v: Violation): ScreenReaderOutput {
  const snippet = v.snippet || v.description;
  const entry = SR_MAP[v.type] ?? SR_DEFAULT;
  const fixed = typeof entry.fixed === "function" ? entry.fixed(snippet) : entry.fixed;

  return {
    file: v.file, line: v.line,
    element: entry.element,
    current: entry.current,
    fixed,
    violation: metaFor(v.type).srViolation,
  };
}

function guessAltText(snippet: string): string {
  const srcMatch = snippet.match(/src=["']([^"']+)["']/);
  if (srcMatch) {
    const name = srcMatch[1].split("/").pop()?.replace(/\.\w+$/, "") || "image";
    return name.replace(/[-_]/g, " ");
  }
  return "descriptive text";
}

function guessAriaLabel(snippet: string): string {
  if (/icon/i.test(snippet)) return "icon button";
  if (/close|dismiss|exit/i.test(snippet)) return "close";
  if (/menu|nav/i.test(snippet)) return "navigation menu";
  if (/search/i.test(snippet)) return "search";
  return "action";
}

function guessInputLabel(snippet: string): string {
  const ph = snippet.match(/placeholder=["']([^"']+)["']/);
  if (ph) return ph[1];
  const name = snippet.match(/name=["']([^"']+)["']/);
  if (name) return name[1].replace(/[-_]/g, " ");
  return "field";
}

/**
 * Generate screen-reader preview text for each violation.
 *
 * Why: Translates technical violations into simulated screen-reader output —
 * what the user hears now vs. what they would hear after the fix. Helps
 * developers understand real-world impact of each accessibility issue.
 *
 * @param violations - Array of violations to preview.
 * @returns Array of screen-reader output objects with current/fixed narration.
 */
export function generateScreenReaderPreview(violations: Violation[]): ScreenReaderOutput[] {
  return violations.map(describeViolation);
}
