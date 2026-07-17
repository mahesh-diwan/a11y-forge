import type { Violation } from "./types";
import type { CheckRunner } from "./violation-meta";
import { lineOf } from "./line-of";

// Detect modal/dialog-like markup lacking keyboard handling.
// Heuristics: role="dialog" or class containing "modal" without aria-modal,
// and JSX/TS event handlers missing onKeyDown Escape or focus trap.
/**
 * Detect dialogs/modals missing keyboard handling.
 *
 * Why: Identifies elements with role="dialog" or modal-class names that lack
 * aria-modal="true" and Escape-key handlers. Both are required for WCAG 2.1.2
 * (No Keyboard Trap) — missing them traps keyboard-only users.
 *
 * @param content - File content to scan.
 * @param file - File path for violation attribution.
 * @returns Violations for missing aria-modal and missing Escape handler.
 */
export function checkKeyboardTrap(content: string, file: string): Violation[] {
  const violations: Violation[] = [];

  const tagRe = /<(div|section|aside|span)[^>]{0,500}>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(content)) !== null) {
    const tag = m[0];
    const hasDialogRole = /role\s*=\s*["']dialog["']/i.test(tag);
    const hasModalClass = /class\s*=\s*["'][^"']*modal[^"']*["']/i.test(tag);
    if (!hasDialogRole && !hasModalClass) continue;

    if (!/aria-modal\s*=\s*["']true["']/i.test(tag)) {
      violations.push({
        type: "missing-aria-modal",
        file,
        line: lineOf(content, m.index),
        description: "Dialog/modal missing aria-modal=\"true\". Screen readers may still access background content.",
        snippet: tag.substring(0, 120),
      });
    }

    const after = content.substring(m.index, m.index + 2000);
    const hasEscape = /(onKeyDown|onKeyPress|onkeyup|handleEscape|Escape)/i.test(after);
    if (!hasEscape) {
      violations.push({
        type: "missing-escape-handler",
        file,
        line: lineOf(content, m.index),
        description: "Modal lacks an Escape-key handler. Keyboard users cannot close it, causing a trap.",
        snippet: tag.substring(0, 120),
      });
    }
  }

  return violations;
}

/**
 * Detect positive tabindex values that break natural tab order.
 *
 * Why: tabindex > 0 forces manual focus ordering that overrides DOM position.
 * WCAG 2.4.3 requires logical focus order. Values 0 (natural order) or -1
 * (programmatic only) are acceptable; positive values are anti-pattern.
 *
 * @param content - File content to scan.
 * @param file - File path for violation attribution.
 * @returns Violations for each positive tabindex found.
 */
export function checkTabindex(content: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const regex = /tabindex\s*=\s*["']([1-9][0-9]*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    violations.push({
      type: "positive-tabindex",
      file,
      line: lineOf(content, m.index),
      description: `tabindex="${m[1]}" forces tab order, breaking logical keyboard navigation. Use 0 or -1.`,
      snippet: m[0],
    });
  }
  return violations;
}

export const keyboardTrapCheck: CheckRunner = {
  type: "missing-escape-handler", kinds: ["jsx", "html"],
  run: (content, file) => checkKeyboardTrap(content, file),
};

export const tabindexCheck: CheckRunner = {
  type: "positive-tabindex", kinds: ["jsx", "html"],
  run: (content, file) => checkTabindex(content, file),
};
