# equity

Dark CLI-style accessibility scanner. Scans GitHub repos for WCAG violations, prioritizes by human impact, and opens fix PRs automatically.

## What it does

Point equity at a public GitHub repo. It runs a static WCAG scan (AST + crawler), scores the repo (A+–F), groups violations by impact via GPT-5.6, generates minimal behavior-preserving fixes, and opens one PR per fix group. Falls back to deterministic grouping + regex fixes when no OpenAI key is present.

Pipeline: **scan → prioritize → fix → PR**.

## How it works

1. **Scan** — `POST /api/scan` walks the repo tree via the GitHub Git Data API, downloads up to 100 source files (HTML/JSX/TSX/Vue/Svelte), and runs checks: contrast, keyboard traps, heading hierarchy, link text, ARIA/alt/form labels, `lang`. Returns violations, score, screen-reader previews, and per-violation confidence.
2. **Prioritize** — `POST /api/prioritize` groups violations by category and ranks by user impact. Requires `consentToAi: true` to send code to the model; otherwise returns a 403.
3. **Fix** — `POST /api/pr` fetches affected files, generates diffs, commits to branch `a11y-fix-<category>`, and opens a PR. `dryRun: true` returns diffs without committing.
4. **Report** — `POST /api/report` and `/api/report/pdf` emit HTML/PDF summaries; `POST /api/badge` (or `GET`) emits an SVG score badge.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add keys below
npm run dev                        # http://localhost:3000
```

Env vars (`.env.local`):

| Variable         | Required | Purpose                                                                        |
| ---------------- | -------- | ------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`   | Yes      | PAT with `repo` scope for tree/commit/PR operations.                           |
| `OPENAI_API_KEY` | No       | Enables GPT-5.6 grouping + fix explanations. Deterministic fallback if absent. |

## API routes

All routes are `POST` unless noted. Requests are JSON; rate-limited to 20 req/min per IP (429 + `Retry-After: 60`). Max body 500 KB.

| Route             | Method | Request body                                                       | Response                                                         |
| ----------------- | ------ | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `/api/scan`       | POST   | `{ "repoUrl": string }`                                            | `{ repoUrl, violations[], score, screenReader[], confidence[] }` |
| `/api/prioritize` | POST   | `{ "violations": Violation[], "consentToAi": true }`               | `{ "groups": FixGroup[] }` (403 if no consent)                   |
| `/api/pr`         | POST   | `{ "repoUrl", "group": FixGroup, "dryRun"?, "consentToAi": true }` | `{ category, url?, number?, fixCount?, explanation?, diffs? }`   |
| `/api/report`     | POST   | `ScanResult` (any of above fields)                                 | `text/html` attachment `a11y-report-<ts>.html`                   |
| `/api/report/pdf` | POST   | `ScanResult` (requires `score`)                                    | `application/pdf` attachment `a11y-report-<ts>.pdf`              |
| `/api/badge`      | POST   | `{ "score": ScoreResult }`                                         | `image/svg+xml` badge                                            |
| `/api/badge`      | GET    | —                                                                  | `image/svg+xml` default "Not scanned" badge                      |

Key types (`src/lib/types.ts`): `Violation { type, file, line, description, snippet? }`, `FixGroup { category, violations[], reasoning }`, `ScoreResult { score, grade, label, color, totalViolations, breakdown[], affectedFiles[] }`, `FixDiff { file, before, after }`, `FixPR { category, url?, number?, fixCount?, diffs? }`.

## Project structure

```
src/
├── app/api/
│   ├── scan/route.ts        # repo tree walk + violation detection
│   ├── prioritize/route.ts  # GPT-5.6 grouping + deterministic fallback
│   ├── pr/route.ts          # branch + commit + PR creation
│   ├── report/{route.ts,pdf/route.ts}  # HTML + PDF reports
│   └── badge/route.ts       # SVG badge (POST + GET)
├── components/  DocsPage.tsx, Mermaid.tsx, Nav.tsx, ScoreCard.tsx
└── lib/         scanner, score, confidence, screen-reader, github,
                 openai, fixer, report, pdf, badge, types, violation-meta
```

## Scripts

| Script          | Action                                     |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start dev server (Next.js, localhost:3000) |
| `npm run build` | Production build                           |
| `npm test`      | Run vitest suite (54 tests, 13 files)      |
| `npm run lint`  | ESLint                                     |

## Tech stack

Next.js 16 (App Router) · TypeScript 5 · Tailwind v4 · Octokit v5 (Git Data API) · OpenAI SDK v6 (GPT-5.6) · @babel/parser (AST) · pdf-lib · mermaid · vitest + playwright.

## Security notes

- **Rate limit** — 20 requests/minute per IP, in-memory (note serverless limitation: counter resets per instance). Excess returns 429 with `Retry-After: 60`. Body capped at 500 KB, total payload at 2 MB.
- **Consent** — AI endpoints (`/api/prioritize`, `/api/pr`) require `consentToAi: true`. Without it, no code leaves the server for model processing (403).
- **No private code without opt-in** — only public repos are scanned. The GitHub token is server-side only; source is never sent to OpenAI unless `consentToAi` is set.
- **Public repos only** — scans require repo read access via the supplied token; inaccessible/private repos return 403.
