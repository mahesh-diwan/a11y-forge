# Submission Draft — Accessibility Forge

## Category

Developer Tools

## Project Description

Accessibility Forge is an autonomous WCAG compliance tool. Point at any GitHub repo. It scans source files for accessibility violations, gives the repo an accessibility grade, shows what screen readers actually say for each element, generates fixes, and opens pull requests — end-to-end, no human in the loop.

Unlike existing a11y tools that only report problems, Accessibility Forge fixes them. Each fix becomes a GitHub PR with before/after evidence, making it easy for maintainers to review and merge.

## Features

1. **Accessibility Score** — scan gives A-F grade with breakdown by violation type. Before/after comparison shows improvement.
2. **Screen Reader Preview** — for each violation, shows exactly what a screen reader says before and after fix. Makes the invisible problem visible.
3. **Visual Diff** — side-by-side code comparison showing the fix applied to each violation.
4. **GPT-5.6 Explanations** — each fix includes a plain-English explanation of why it matters for real users.
5. **Autonomous PR Generation** — end-to-end: scan → prioritize → fix → branch → commit → PR.

## How We Used Codex

**Codex accelerated every phase:**

1. **Project scaffold** — Codex bootstrapped the Next.js + TypeScript + Tailwind project, created all API route handlers, and wired the type system. What would take hours of boilerplate took ~10 minutes.

2. **AST scanner** — We designed the scanning patterns. Codex implemented the GitHub Git Data API tree-walker, the batch-parallel file fetching (5 files at a time), and the regex-based violation detectors for alt text, ARIA labels, form labels, html lang, and color contrast.

3. **Prioritization engine** — Codex wrote the GPT-5.6 integration for intelligent grouping + the deterministic fallback when API quota isn't available. Decision: use GPT-5.6 when possible for nuanced reasoning, fallback to rule-based for reliability.

4. **PR creation pipeline** — Codex built the full GitHub API integration: tree creation, blob commits, branch management, PR generation with markdown bodies. This was the most complex part — multi-step git operations — and Codex handled it without errors.

5. **Screen reader simulator** — Codex built the reverse-engineering of screen reader output for each violation type, mapping HTML patterns to what assistive technologies actually announce.

6. **UI dashboard** — Codex designed and implemented the tabbed interface with real-time activity log, violations display, screen reader preview, visual diff, and PR status cards using Tailwind.

**Key engineering decision:** Use GitHub's Git Data API (blobs/trees/commits) instead of the Content API for writing — this let us create proper git commits with accurate parent pointers and branch management, rather than relying on the less reliable "create or update file" endpoint.

## How We Used GPT-5.6

GPT-5.6 powers two layers:

1. **Prioritization** — Given a raw list of violations, GPT-5.6 groups semantically similar violations, orders by real user impact (not just WCAG severity), and provides plain-English reasoning per group explaining human impact.

2. **Fix explanations** — For each fix, GPT-5.6 generates a one-sentence explanation in plain English explaining why the fix matters for real users. This goes into the PR description so maintainers understand the human impact.

When GPT-5.6 API is unavailable (quota limits), the system gracefully falls back to deterministic grouping and generic explanations, ensuring the tool still works.

## How GPT-5.6 and Codex Worked Together

The pipeline is a true collaboration:

- **Codex** handles structural work: parsing code, traversing file trees, creating git commits, managing branches, opening PRs
- **GPT-5.6** handles reasoning work: understanding context, prioritizing by human impact, explaining why each fix matters
- Codex executes the fixes that GPT-5.6 prioritizes, creating a seamless build-fix loop

## Demo Video Script (3 min)

1. (0:00-0:30) What is Accessibility Forge? Autonomous a11y fixer. Input: repo URL. Output: PRs with fixes.
2. (0:30-1:00) Enter sveltejs/svelte repo. Watch scan find 21 violations. Score: A+ (99/100).
3. (1:00-1:30) Screen reader tab: shows what a blind user actually hears before/after fixes.
4. (1:30-2:00) Visual diff tab: side-by-side code comparison with fix applied.
5. (2:00-2:45) PR generation: Codex creates branches, fixes files, opens PRs with GPT-5.6 explanations.
6. (2:45-3:00) Summary: End-to-end autonomous fixing. Built with Codex + GPT-5.6.
