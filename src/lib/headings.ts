import type { Violation } from "./types";
import type { CheckRunner } from "./violation-meta";
import { lineOf } from "./line-of";

/**
 * Check heading structure for skipped levels.
 *
 * Why: Screen reader users navigate pages via heading outline. Skipping levels
 * (h1 -> h3) breaks document hierarchy and confuses navigation. Also flags
 * pages that don't start with h1. Based on WCAG 1.3.1 Info and Relationships.
 *
 * @param content - File content to scan.
 * @param file - File path for violation attribution.
 * @returns Violations for skipped heading levels or missing initial h1.
 */
export function checkHeadings(content: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const regex = /<h([1-6])(?:\s|>)/gi;
  const found: { level: number; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    found.push({ level: parseInt(m[1], 10), index: m.index });
  }
  if (found.length === 0) return violations;

  let prev = 0;
  for (const h of found) {
    if (prev === 0) {
      if (h.level !== 1) {
        violations.push({
          type: "heading-structure",
          file,
          line: lineOf(content, h.index),
          description: `First heading is h${h.level}. Pages should start with a single h1.`,
          snippet: `<h${h.level}>`,
        });
      }
    } else if (h.level > prev + 1) {
      violations.push({
        type: "heading-structure",
        file,
        line: lineOf(content, h.index),
        description: `Heading level jumps from h${prev} to h${h.level}, skipping intermediate levels. Screen reader users lose outline structure.`,
        snippet: `<h${h.level}>`,
      });
    }
    prev = h.level;
  }

  return violations;
}

export const headingsCheck: CheckRunner = {
  type: "heading-structure", kinds: ["jsx", "html"],
  run: (content, file) => checkHeadings(content, file),
};
