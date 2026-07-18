import { NextRequest, NextResponse } from "next/server";
import type { FixGroup } from "@/lib/types";
import { getOctokit, parseGithubUrl, fetchFile } from "@/lib/github";
import { getOpenAI } from "@/lib/openai";
import { MODEL } from "@/lib/model";
import { generateFixes } from "@/lib/fixer";
import { metaFor } from "@/lib/violation-meta";
import { guardAndParse } from "@/lib/request-guard";
import { prSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError, ConfigError, GitHubError, OpenAIError } from "@/lib/errors";

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<{ repoUrl?: string; group?: FixGroup; dryRun?: boolean; consentToAi?: boolean }>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const zod = prSchema.safeParse(parsed.data);
  if (!zod.success)
    throw new ValidationError("Invalid request body", zod.error.flatten());
  const { repoUrl, dryRun } = zod.data;
  const group = zod.data.group as unknown as FixGroup;
  if (!group || !group.category || !Array.isArray(group.violations)) {
    throw new ValidationError("Invalid fix group", { category: "" });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new ConfigError("GITHUB_TOKEN not configured");
  }

  const parsedUrl = parseGithubUrl(repoUrl || "");
  if (!parsedUrl) {
    throw new ValidationError("Invalid repo URL", { category: group.category });
  }

  const octokit = getOctokit(token);

  // Verify repo is accessible before proceeding
  try {
    await octokit.rest.repos.get({ owner: parsedUrl.owner, repo: parsedUrl.repo });
  } catch {
    throw new ValidationError("Repo not found or not accessible with current token", { category: group.category });
  }

  // Fetch file contents for each violation
  const fileContents: Record<string, string> = {};
  for (const v of group.violations) {
    if (!fileContents[v.file]) {
      try {
        fileContents[v.file] = await fetchFile(octokit, parsedUrl.owner, parsedUrl.repo, v.file);
      } catch {
        // skip
      }
    }
  }

  const { files, usedFallback } = await generateFixes(fileContents, group);

  if (Object.keys(files).length === 0) {
    throw new ValidationError("No fixes generated", { category: group.category });
  }

  const diffs = Object.entries(files).map(([file, after]) => ({
    file,
    before: fileContents[file] ?? "",
    after,
  }));

  if (dryRun) {
    return NextResponse.json({
      category: group.category,
      dryRun: true,
      fixCount: Object.keys(files).length,
      diffs,
      explanation: usedFallback
        ? "Applied deterministic regex fixes (GPT-5.6 unavailable)."
        : "Generated fixes with GPT-5.6.",
    });
  }

  const branchName = `a11y-fix-${group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const { data: repoData } = await octokit.rest.repos.get({ owner: parsedUrl.owner, repo: parsedUrl.repo });

  let baseSha: string;
  try {
    const { data: refData } = await octokit.rest.git.getRef({
      owner: parsedUrl.owner, repo: parsedUrl.repo, ref: `heads/${branchName}`,
    });
    baseSha = refData.object.sha;
  } catch {
    const { data: branchData } = await octokit.rest.repos.getBranch({
      owner: parsedUrl.owner, repo: parsedUrl.repo, branch: repoData.default_branch,
    });
    baseSha = branchData.commit.sha;
    await octokit.rest.git.createRef({
      owner: parsedUrl.owner, repo: parsedUrl.repo,
      ref: `refs/heads/${branchName}`, sha: baseSha,
    });
  }

  // All blobs, then one tree + one commit
  const treeEntries = await Promise.all(
    Object.entries(files).map(async ([filePath, content]) => {
      const { data: blobData } = await octokit.rest.git.createBlob({
        owner: parsedUrl.owner, repo: parsedUrl.repo, content, encoding: "utf-8",
      });
      return { path: filePath, mode: "100644" as const, type: "blob" as const, sha: blobData.sha };
    })
  );

  const { data: treeData } = await octokit.rest.git.createTree({
    owner: parsedUrl.owner, repo: parsedUrl.repo, base_tree: baseSha, tree: treeEntries,
  });
  const { data: commitData } = await octokit.rest.git.createCommit({
    owner: parsedUrl.owner, repo: parsedUrl.repo,
    message: `fix(a11y): ${group.category} — ${group.reasoning?.substring(0, 100).replace(/\n/g, " ") ?? ""}`,
    tree: treeData.sha, parents: [baseSha],
  });
  baseSha = commitData.sha;

  await octokit.rest.git.updateRef({
    owner: parsedUrl.owner, repo: parsedUrl.repo,
    ref: `heads/${branchName}`, sha: baseSha,
  });

  // GPT-5.6 plain-English explanations (optional)
  let explanations: string[] = [];
  try {
    const expPrompt = `For each violation below, write ONE sentence explaining the fix in plain English a non-developer can understand. Focus on the human impact, not technical jargon.

Violations:
${JSON.stringify(group.violations, null, 2)}

Respond JSON: { "explanations": ["sentence 1", "sentence 2", ...] }`;

    const openai = await getOpenAI();
    const expResponse = await openai.chat.completions.create({
      model: MODEL, messages: [{ role: "user", content: expPrompt }],
      response_format: { type: "json_object" },
    }, { signal: AbortSignal.timeout(15_000), timeout: 15_000 });
    const expContent = expResponse.choices[0]?.message?.content;
    if (expContent) {
      const parsed: unknown = JSON.parse(expContent);
      const exps = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>).explanations : undefined;
      if (Array.isArray(exps)) explanations = exps as string[];
    }
  } catch {
    // explanations optional
  }

  const fixList = group.violations
    .map((v, i) => {
      const wcag = metaFor(v.type).wcagRef;
      const exp = explanations[i] ? `\n  > ${explanations[i]}` : "";
      return `- [ ] \`${v.file}:${v.line}\` — ${v.description} _(${wcag})_${exp}`;
    })
    .join("\n");

  const prBody = `## ♿ Accessibility Fix: ${group.category}

**Why this matters:** ${group.reasoning}

Generated autonomously by **a11y-forge** (Codex + GPT-5.6). Each item below was detected by static/WCAG analysis and fixed with a minimal, behavior-preserving change.

### Fixes included
${fixList}

### Checklist for reviewers
- [ ] Changes are limited to accessibility attributes/labels (no logic changed)
- [ ] Contrast fixes meet WCAG AA 4.5:1 where computed
- [ ] No new console warnings introduced
- [ ] Verified with keyboard-only navigation

### Impact
Improves WCAG compliance and makes the app usable for people relying on screen readers, keyboard navigation, and high-contrast modes.

---
_Generated by a11y-forge · Codex + GPT-5.6 · OpenAI Build Week 2026_`;

  const { data: prData } = await octokit.rest.pulls.create({
    owner: parsedUrl.owner, repo: parsedUrl.repo,
    title: `fix(a11y): ${group.category}`,
    head: branchName, base: repoData.default_branch, body: prBody,
  });

  return NextResponse.json({
    category: group.category,
    url: prData.html_url,
    number: prData.number,
    fixCount: Object.keys(files).length,
    explanation: explanations.join("\n"),
    diffs,
  });
}

export const POST = withErrorHandler(handle);
