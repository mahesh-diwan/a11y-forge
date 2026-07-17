import type { Violation } from "./types";
import { metaFor } from "./violation-meta";

interface ConfidenceResult {
  violation: Violation;
  confidence: number;
  reasoning: string;
}

function getConfidence(v: Violation): ConfidenceResult {
  const base = metaFor(v.type).confidenceBase;

  // high-confidence boosters
  let confidence = base;
  let reasoning = "";

  if (v.type === "missing-alt-text" && v.snippet) {
    if (/<img[^>]+src=["'][^"']+["'][^>]*>/.test(v.snippet)) {
      confidence = Math.min(98, confidence + 3);
      reasoning = "Clear img tag with src but no alt. Safe to add.";
    }
  }

  if (v.type === "missing-aria-label" && v.snippet) {
    if (/<button[^>]*>/.test(v.snippet) && !/>[^<]+</.test(v.snippet)) {
      confidence = Math.min(95, confidence + 5);
      reasoning = "Button with no text content and no aria-label. Unambiguously inaccessible.";
    }
  }

  if (v.type === "missing-form-label" && v.snippet) {
    const hasId = /id\s*=/.test(v.snippet);
    const hasAriaLabel = /aria-label/.test(v.snippet);
    if (!hasId && !hasAriaLabel) {
      confidence = Math.min(92, confidence + 2);
      reasoning = "Input with no id, no aria-label, no associated label. Definitely needs fix.";
    }
  }

  if (v.type === "low-contrast") {
    reasoning = "WCAG contrast ratio computed directly; below 4.5:1 is a definitive failure.";
  }

  if (v.type === "potential-contrast-issue") {
    confidence = Math.max(50, confidence - 10);
    reasoning = "Contrast requires visual verification. Pattern detected but ratio unknown.";
  }

  if (v.type === "positive-tabindex") {
    reasoning = "tabindex > 0 is an explicit anti-pattern per WCAG 2.4.3.";
  }

  if (!reasoning) {
    reasoning = `${v.type.replace(/-/g, " ")} pattern detected with ${confidence}% confidence.`;
  }

  return { violation: v, confidence, reasoning };
}

/**
 * Score confidence for each violation based on meta and context signals.
 *
 * Why: Not all violations are equally certain — regex-based detection may
 * produce false positives. This assigns a confidence percentage with reasoning
 * so downstream consumers (auto-fix, reporting) can weigh reliability.
 *
 * @param violations - Violations to evaluate.
 * @returns Array of confidence results with score and reasoning per violation.
 */
export function scoreConfidence(violations: Violation[]): ConfidenceResult[] {
  return violations.map(getConfidence);
}

/**
 * Calculate average confidence across all scored violations.
 *
 * Why: Provides aggregate confidence metric for the entire scan result.
 * Useful for UI indicators like "overall detection confidence: 87%".
 *
 * @param results - Array of scored confidence results.
 * @returns Average confidence percentage (0-100), 0 for empty input.
 */
export function averageConfidence(results: ConfidenceResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length);
}
