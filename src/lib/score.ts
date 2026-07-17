import type { Violation } from "./types";
import { metaFor } from "./violation-meta";

// penalty per violation type — weight sourced from VIOLATION_META

function getGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 95) return { grade: "A+", label: "Excellent", color: "#22c55e" };
  if (score >= 90) return { grade: "A", label: "Excellent", color: "#22c55e" };
  if (score >= 80) return { grade: "B", label: "Good", color: "#84cc16" };
  if (score >= 70) return { grade: "C", label: "Fair", color: "#eab308" };
  if (score >= 55) return { grade: "D", label: "Poor", color: "#f97316" };
  return { grade: "F", label: "Critical", color: "#ef4444" };
}

/**
 * Aggregate accessibility score for a scanned repo.
 *
 * Why: Provides a single 0-100 score with letter grade, per-violation-type
 * breakdown, and affected file list. Used by the report UI to show overall
 * accessibility health at a glance.
 *
 * @param score - Numeric score 0-100.
 * @param grade - Letter grade A+ through F.
 * @param label - Human-readable label (Excellent, Good, Fair, Poor, Critical).
 * @param color - CSS hex color for score display.
 * @param totalViolations - Total count across all types.
 * @param breakdown - Per-violation-type detail with count and weighted impact.
 * @param affectedFiles - Unique file paths with at least one violation.
 */
export interface A11yScore {
  score: number;
  grade: string;
  label: string;
  color: string;
  totalViolations: number;
  breakdown: { type: string; count: number; impact: number }[];
  affectedFiles: string[];
}

/**
 * Calculate overall accessibility score from scanned violations.
 *
 * Why: Applies weighted penalty per violation type with density multiplier
 * so repos broken across many files score worse than isolated issues. Density
 * uses log2 of affected file count to dampen large-repo penalty inflation.
 *
 * @param violations - All violations found during scan.
 * @returns Complete A11yScore object with score, grade, and breakdown.
 */
export function calculateScore(violations: Violation[]): A11yScore {
  const files = new Set(violations.map((v) => v.file));
  const byType = new Map<string, number>();
  for (const v of violations) {
    byType.set(v.type, (byType.get(v.type) || 0) + 1);
  }

  const breakdown = Array.from(byType.entries()).map(([type, count]) => ({
    type,
    count,
    impact: metaFor(type).weight * count,
  }));

  const totalImpact = breakdown.reduce((sum, b) => sum + b.impact, 0);
  // Fixed per-violation deduction (not divided by scanned-file count, which
  // inflated small repos to near-A+). Add a density multiplier so a repo that is
  // broadly broken across many files is penalized harder than a few isolated
  // issues, without dividing by the (often large) total scanned count.
  const affected = files.size;
  const density = affected > 0 ? 1 + Math.log2(affected) / 8 : 1;
  const penalty = Math.min(100, totalImpact * density);
  const score = Math.max(0, Math.round(100 - penalty));
  const { grade, label, color } = getGrade(score);

  return {
    score,
    grade,
    label,
    color,
    totalViolations: violations.length,
    breakdown,
    affectedFiles: Array.from(files),
  };
}
