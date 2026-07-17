import type { Violation } from "./types";
import { getOctokit, parseGithubUrl, fetchFile } from "./github";
import { coalesce } from "./coalesce";
import { metaFor, type FileKind, type CheckRunner } from "./violation-meta";
import { lowContrastCheck } from "./contrast";
import { keyboardTrapCheck, tabindexCheck } from "./keyboard";
import { headingsCheck } from "./headings";
import { linksCheck } from "./links";
import { astCheck } from "./ast-scanner";
import { lineOf } from "./line-of";

function isJsxFile(path: string): boolean {
  return /\.(tsx|jsx|mtsx|ctsx)$/i.test(path);
}

function kindOf(path: string): FileKind {
  return isJsxFile(path) ? "jsx" : "html";
}

// --- HTML check runners (regex-based) ---

function checkMissingAltText(content: string, file: string): Violation[] {
  const out: Violation[] = [];
  const re = /<img[^>]*>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (!/alt\s*=/i.test(m[0])) {
      out.push({
        type: "missing-alt-text", file,
        line: lineOf(content, m.index),
        description: "Image missing alt attribute. Screen readers cannot describe this image.",
        snippet: m[0].substring(0, 120),
      });
    }
  }
  return out;
}

function checkMissingAriaLabel(content: string, file: string): Violation[] {
  const out: Violation[] = [];
  const re = /<button[^>]*>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const tag = m[0];
    const hasText = />[^<]+</.test(content.substring(m.index));
    if (!hasText && !/aria-label\s*=/i.test(tag) && !/aria-labelledby\s*=/i.test(tag)) {
      out.push({
        type: "missing-aria-label", file,
        line: lineOf(content, m.index),
        description: "Button without text content needs aria-label for screen readers.",
        snippet: tag.substring(0, 120),
      });
    }
  }
  return out;
}

function checkMissingFormLabel(content: string, file: string): Violation[] {
  const out: Violation[] = [];
  const re = /<(input|select|textarea)[^>]*>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const tag = m[0];
    const hasAria = /aria-label\s*=/i.test(tag) || /aria-labelledby\s*=/i.test(tag);
    const id = tag.match(/id\s*=\s*["']([^"']+)["']/)?.[1];
    if (!hasAria && !id) {
      out.push({
        type: "missing-form-label", file,
        line: lineOf(content, m.index),
        description: "Form input missing accessible label. Use aria-label or associate with a <label> via id.",
        snippet: tag.substring(0, 120),
      });
    }
  }
  return out;
}

function checkMissingHtmlLang(content: string, file: string): Violation[] {
  if (!file.endsWith(".html") && file !== "index.html") return [];
  if (/<html[^>]*>/i.test(content) && !/<html[^>]*\slang\s*=/i.test(content)) {
    return [{
      type: "missing-html-lang", file, line: 1,
      description: "<html> tag missing lang attribute. Screen readers cannot determine page language.",
      snippet: content.match(/<html[^>]*>/i)?.[0]?.substring(0, 120),
    }];
  }
  return [];
}

/**
 * All registered accessibility checks executed during a scan.
 *
 * Why: Central registry maps violation types to their checker implementations.
 * Order matters — checks run in definition order. Each check declares which
 * file kinds it applies to via `kinds`.
 */
export const CHECKS: CheckRunner[] = [
  { type: "missing-alt-text", kinds: ["html"], run: checkMissingAltText },
  { type: "missing-aria-label", kinds: ["html"], run: checkMissingAriaLabel },
  { type: "missing-form-label", kinds: ["html"], run: checkMissingFormLabel },
  { type: "missing-html-lang", kinds: ["html"], run: checkMissingHtmlLang },
  lowContrastCheck,
  keyboardTrapCheck,
  tabindexCheck,
  headingsCheck,
  linksCheck,
  astCheck,
];

function applicableChecks(kind: FileKind): CheckRunner[] {
  return CHECKS.filter((c) => c.kinds.includes(kind));
}

function dedupe(violations: Violation[]): Violation[] {
  const seen = new Set<string>();
  const out: Violation[] = [];
  for (const v of violations) {
    const key = `${v.type}|${v.file}|${v.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

function isRelevantFile(path: string): boolean {
  return /\.(html?|tsx?|jsx?|vue|svelte)$/i.test(path);
}

const BRANCHES = ["heads/main", "heads/master", "heads/develop"];

async function getDefaultBranchRef(octokit: ReturnType<typeof getOctokit>, owner: string, repo: string) {
  for (const ref of BRANCHES) {
    try {
      const { data } = await octokit.rest.git.getRef({ owner, repo, ref });
      return data;
    } catch {
      continue;
    }
  }
  throw new Error("Could not find default branch (tried main, master, develop)");
}

/**
 * Scan a GitHub repo for accessibility violations.
 *
 * Why: Fetches repo file tree, filters relevant HTML/JSX/TSX files, runs
 * all applicable checks in batches of 5 to avoid overloading the API.
 * Deduplicates violations by type/file/line before returning.
 *
 * @param repoUrl - Full GitHub repo URL (e.g. "https://github.com/owner/repo").
 * @param token - Optional GitHub PAT for private repos.
 * @param octokit - Pre-configured Octokit instance (default from getOctokit).
 * @returns Flat array of unique Violations across all scanned files.
 * @throws If repo URL is invalid or no default branch found.
 */
export async function scanRepo(repoUrl: string, token?: string, octokit = getOctokit(token)): Promise<Violation[]> {
  return coalesce(`scan:${repoUrl}`, () => scanRepoInner(repoUrl, token, octokit));
}

async function scanRepoInner(repoUrl: string, token?: string, octokit = getOctokit(token)): Promise<Violation[]> {
  const repoInfo = parseGithubUrl(repoUrl);
  if (!repoInfo) throw new Error("Invalid GitHub URL");
  const { owner, repo } = repoInfo;

  const allViolations: Violation[] = [];

  const refData = await getDefaultBranchRef(octokit, owner, repo);

  const { data: treeData } = await octokit.rest.git.getTree({
    owner, repo, tree_sha: refData.object.sha, recursive: "true",
  });

  const relevantFiles = treeData.tree
    .filter((item) => item.type === "blob" && isRelevantFile(item.path || ""))
    .slice(0, 150);

  const batchSize = 8;
  for (let i = 0; i < relevantFiles.length; i += batchSize) {
    const batch = relevantFiles.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const content = await fetchFile(octokit, owner, repo, item.path!);
          const kind = kindOf(item.path!);
          const found = applicableChecks(kind).flatMap((c) => c.run(content, item.path!));
          return dedupe(found) as Violation[];
        } catch {
          return [] as Violation[];
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") allViolations.push(...r.value);
    }
  }

  return allViolations;
}

export { metaFor };
