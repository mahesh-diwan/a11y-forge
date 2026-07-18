/**
 * Accessibility violation found during scanning.
 * Identifies type, source file location, and human-readable description.
 */
export interface Violation {
  type: string;
  file: string;
  line: number;
  description: string;
  snippet?: string;
}

/**
 * Describes which check categories were applied and which were scope-limited.
 * Static-only checks (like contrast) are documented here as caveats.
 */
export interface CoverageInfo {
  fileCount: number;
  categories: string[];
  scopeLimited: string[];
  skipped: string[];
}

/**
 * Top-level scan output for a single repository.
 * Contains violations list plus optional score, screen reader analysis, confidence data, and coverage info.
 */
export interface ScanResult {
  repoUrl: string;
  violations: Violation[];
  score?: ScoreResult;
  screenReader?: ScreenReaderOutput[];
  confidence?: ConfidenceResult[];
  coverage?: CoverageInfo;
}

/**
 * Aggregated score for accessibility posture.
 * Includes numeric score (0-100), letter grade, color for display, violation breakdown by type, and affected file list.
 */
export interface ScoreResult {
  score: number;
  grade: string;
  label: string;
  color: string;
  totalViolations: number;
  breakdown: { type: string; count: number; impact: number }[];
  affectedFiles: string[];
}

/**
 * Before/after screen reader output for a violation fix.
 * Shows what screen reader announces currently vs after fix applied.
 */
export interface ScreenReaderOutput {
  file: string;
  line: number;
  element: string;
  current: string;
  fixed: string;
  violation: string;
}

/**
 * AI confidence assessment for a single violation.
 * Provides numeric confidence score and reasoning string from model.
 */
export interface ConfidenceResult {
  violation: Violation;
  confidence: number;
  reasoning: string;
}

/**
 * Group of related violations grouped for batch fixing.
 * Contains category label, violations list, and AI reasoning for grouping.
 */
export interface FixGroup {
  category: string;
  violations: Violation[];
  reasoning: string;
}

/**
 * Single-file diff for an accessibility fix.
 * Shows before and after content for one file.
 */
export interface FixDiff {
  file: string;
  before: string;
  after: string;
}

/**
 * Pull request created for a fix group.
 * Includes PR URL, number, fix count per category, and optional diffs for dry-run mode.
 */
export interface FixPR {
  category: string;
  url?: string;
  number?: number;
  fixCount?: number;
  error?: string;
  explanation?: string;
  dryRun?: boolean;
  diffs?: FixDiff[];
}
