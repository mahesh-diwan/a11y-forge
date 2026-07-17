/**
 * Supported file categories for accessibility scanning.
 *
 * Why: Some checks only apply to JSX (e.g. AST-based analysis) or only to
 * raw HTML (e.g. html lang attribute). FileKind gates which checks run.
 */
export type FileKind = "jsx" | "html";

export interface CheckRunner {
  type: string;
  kinds: FileKind[];
  run: (content: string, file: string) => import("./types").Violation[];
}

/**
 * Metadata for a violation type — single source of truth.
 *
 * Why: Centralizes weight (for scoring), confidence baseline, screen-reader
 * description, WCAG reference, and applicable file kinds. Previously
 * duplicated across score.ts, confidence.ts, screen-reader.ts, and the PR route.
 *
 * @param weight - Penalty multiplier for score calculation (1-3).
 * @param confidenceBase - Default confidence percentage for this violation type.
 * @param srViolation - Human-readable screen-reader impact description.
 * @param wcagRef - WCAG criterion reference (e.g. "WCAG 1.1.1 Non-text Content (A)").
 * @param kinds - File kinds this violation can appear in.
 */
export type Severity = "critical" | "serious" | "moderate";

export interface ViolationMeta {
  weight: number;
  confidenceBase: number;
  srViolation: string;
  wcagRef: string;
  kinds: FileKind[];
  displayName: string;
  severity: Severity;
  sortOrder: number;
}

/**
 * Registry of all violation types with their metadata.
 *
 * Why: Single source of truth keyed by Violation.type. Used by score, confidence,
 * screen-reader preview, and PR report modules. Adding a new violation type
 * requires an entry here.
 */
export const VIOLATION_META: Record<string, ViolationMeta> = {
  "missing-alt-text": {
    weight: 3, confidenceBase: 95, srViolation: "Screen reader says 'image' but cannot describe what it shows.",
    wcagRef: "WCAG 1.1.1 Non-text Content (A)", kinds: ["jsx", "html"],
    displayName: "Missing image description", severity: "critical", sortOrder: 0,
  },
  "missing-aria-label": {
    weight: 2, confidenceBase: 80, srViolation: "Screen reader announces 'button' with no label. User cannot tell what it does.",
    wcagRef: "WCAG 4.1.2 Name, Role, Value (A)", kinds: ["jsx", "html"],
    displayName: "Unlabeled button", severity: "serious", sortOrder: 1,
  },
  "missing-form-label": {
    weight: 2, confidenceBase: 85, srViolation: "Screen reader announces 'text field' with no label. User cannot tell what to type.",
    wcagRef: "WCAG 1.3.1 Info and Relationships (A)", kinds: ["jsx", "html"],
    displayName: "Unlabeled form field", severity: "serious", sortOrder: 2,
  },
  "missing-html-lang": {
    weight: 2, confidenceBase: 90, srViolation: "Screen reader cannot determine language. May mispronounce all content.",
    wcagRef: "WCAG 3.1.1 Language of Page (A)", kinds: ["html"],
    displayName: "Missing page language", severity: "serious", sortOrder: 3,
  },
  "low-contrast": {
    weight: 2, confidenceBase: 92, srViolation: "Computed contrast ratio below 4.5:1. Low-vision users cannot read the text.",
    wcagRef: "WCAG 1.4.3 Contrast (Minimum) (AA)", kinds: ["jsx", "html"],
    displayName: "Hard-to-read text", severity: "serious", sortOrder: 4,
  },
  "missing-aria-modal": {
    weight: 2, confidenceBase: 85, srViolation: "Without aria-modal, screen readers can still reach background content behind the dialog.",
    wcagRef: "WCAG 4.1.2 Name, Role, Value (A)", kinds: ["jsx"],
    displayName: "Unlabeled popup", severity: "serious", sortOrder: 5,
  },
  "missing-escape-handler": {
    weight: 2, confidenceBase: 80, srViolation: "Keyboard users cannot close the dialog, trapping focus inside.",
    wcagRef: "WCAG 2.1.2 No Keyboard Trap (A)", kinds: ["jsx"],
    displayName: "Missing escape key handler", severity: "critical", sortOrder: 6,
  },
  "positive-tabindex": {
    weight: 2, confidenceBase: 90, srViolation: "tabindex > 0 reorders keyboard navigation, confusing screen reader and keyboard users.",
    wcagRef: "WCAG 2.4.3 Focus Order (A)", kinds: ["jsx", "html"],
    displayName: "Custom tab order", severity: "moderate", sortOrder: 7,
  },
  "heading-structure": {
    weight: 2, confidenceBase: 85, srViolation: "Skipped heading levels break the document outline screen reader users navigate by.",
    wcagRef: "WCAG 1.3.1 Info and Relationships (A)", kinds: ["jsx", "html"],
    displayName: "Heading structure issue", severity: "moderate", sortOrder: 8,
  },
  "vague-link-text": {
    weight: 1, confidenceBase: 70, srViolation: "Screen reader users hear links out of context; vague text gives no destination.",
    wcagRef: "WCAG 2.4.4 Link Purpose (A)", kinds: ["jsx", "html"],
    displayName: "Unclear link text", severity: "moderate", sortOrder: 9,
  },
  "iframe-no-title": {
    weight: 2, confidenceBase: 90, srViolation: "Screen readers cannot tell the user what the iframe contains without a title.",
    wcagRef: "WCAG 4.1.2 Name, Role, Value (A)", kinds: ["jsx", "html"],
    displayName: "Unlabeled embedded content", severity: "serious", sortOrder: 10,
  },
  "empty-alt-meaningful-img": {
    weight: 1, confidenceBase: 65, srViolation: "Empty alt on a meaningful image hides its content from screen reader users.",
    wcagRef: "WCAG 1.1.1 Non-text Content (A)", kinds: ["jsx", "html"],
    displayName: "Missing image description", severity: "moderate", sortOrder: 11,
  },
  "potential-contrast-issue": {
    weight: 1, confidenceBase: 60, srViolation: "Text blends into background. Low-vision users cannot read it.",
    wcagRef: "WCAG 1.4.3 Contrast (Minimum) (AA)", kinds: ["jsx", "html"],
    displayName: "Possible contrast issue", severity: "moderate", sortOrder: 12,
  },
};

/**
 * Look up metadata for violation type.
 *
 * Why: Provides safe access with fallback unknown-violation defaults.
 * Prevents crashes when encountering unrecognized violation types from
 * custom or future checks. Returns reasonable defaults so callers don't
 * need null-checking.
 *
 * @param type - Violation type string (e.g. "missing-alt-text").
 * @returns ViolationMeta for the type, or default metadata for unknown types.
 */
export function severityColor(severity: Severity): string {
  return severity === "critical" ? "#ef4444" : severity === "serious" ? "#f97316" : "#eab308";
}

export function metaFor(type: string): ViolationMeta {
  return (
    VIOLATION_META[type] || {
      weight: 2,
      confidenceBase: 70,
      srViolation: "Unknown accessibility issue.",
      wcagRef: "WCAG",
      kinds: ["jsx", "html"],
      displayName: type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      severity: "moderate",
      sortOrder: 99,
    }
  );
}
