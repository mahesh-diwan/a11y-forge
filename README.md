# a11y-forge

Dark CLI-style accessibility scanner. Scans GitHub repos for WCAG violations, prioritizes by human impact, and opens fix PRs automatically.

## Built for OpenAI Build Week 2026

Developed during [OpenAI Build Week](https://openai.devpost.com) — an autonomous WCAG scanner powered by AI tools.

### GPT-5.6 at runtime

The core intelligence runs on **OpenAI GPT-5.6**. When a user scans a repo, violations are grouped by category and ranked by user impact via `/api/prioritize` — a real-time call to `gpt-5.6-sol`. This powers the AI grouping that makes the output useful instead of a raw list of errors.

### AI-assisted development

The project was built using AI coding agents throughout:

- **[opencode](https://opencode.ai)** — an AI coding CLI that handled scaffolding, testing, debugging, and deployment. Generated API routes, scanner checks, UI components, and 165 unit tests via conversational prompts.
- **Codex CLI** — Installed and configured during Build Week. Session IDs: `019f7944-cb18-7b53-b645-30ca77d30ccd`, `019f7946-93b3-7592-b24e-ef2b9d5f9fec`, `019f7949-77f2-7a41-8887-153567c84691`. Full execution was blocked by API quota exhaustion on the free-tier key.

### Key AI contributions

| Area           | How AI helped                                                         |
| -------------- | --------------------------------------------------------------------- |
| API design     | Generated 6 API route scaffolds from natural-language descriptions    |
| Scanner engine | Implemented 12 WCAG check types (AST, CSS, regex)                     |
| UI             | Built responsive components through iterative prompts                 |
| Bug fixes      | Diagnosed Next.js 16 CSP crash, skeleton loading bug, mobile overflow |
| Testing        | Maintained 165 vitest + 3 Playwright e2e tests                        |
| Deployment     | Configured Vercel pipeline, env vars, CSP headers                     |

## Features

- **WCAG 2.2 AA scan** — 12 check types covering contrast, keyboard, headings, ARIA, forms, links, language, and more. Static analysis via AST parsing, regex patterns, and CSS property inspection.
- **AI grouping** — OpenAI model groups violations by category and ranks by user impact. Deterministic fallback when no key is present.
- **Auto PRs** — Creates branches, commits fixes, and opens pull requests per violation category. Dry-run mode returns diffs without touching GitHub.
- **Badge generation** — SVG score badge (A+–F) for repo READMEs. POST with score data or GET for default.
- **HTML/PDF reports** — Full scan report with violation details, score breakdown, and affected files.
- **Screen reader preview** — Simulates how violations affect assistive technology output.

## What it does

Point a11y-forge at a public GitHub repo. It runs a static WCAG scan (AST + crawler), scores the repo (A+–F), groups violations by impact via OpenAI model, generates minimal behavior-preserving fixes, and opens one PR per fix group. Falls back to deterministic grouping + regex fixes when no OpenAI key is present.

Pipeline: **scan → prioritize → fix → PR**.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│             │     │              │     │             │     │            │
│   SCAN      │────▶│  PRIORITIZE  │────▶│    FIX      │────▶│   REPORT   │
│             │     │              │     │             │     │            │
└─────────────┘     └──────────────┘     └─────────────┘     └────────────┘
      │                    │                    │                    │
      ▼                    ▼                    ▼                    ▼
  Git Data API        OpenAI model          Octokit              pdf-lib
  @babel/parser      deterministic          branch +            HTML/SVG
  regex/CSS          fallback               commit + PR         templates
```

Four-stage pipeline:

1. **Scan** — Fetches repo tree via GitHub Git Data API, downloads up to 150 source files (HTML/JSX/TSX/Vue/Svelte/CSS), runs 12 check types.
2. **Prioritize** — Groups violations by WCAG category, ranks by severity and user impact. Uses OpenAI model when consent is given; deterministic fallback otherwise.
3. **Fix** — Generates minimal diffs, commits to `a11y-fix-<category>` branch, opens PR. Each fix preserves existing behavior.
4. **Report** — Emits HTML, PDF, or SVG score badge summarizing results.

## How it works

1. **Scan** — `POST /api/scan` walks the repo tree via the GitHub Git Data API, downloads up to 150 source files (HTML/JSX/TSX/Vue/Svelte/CSS), and runs checks: contrast, keyboard traps, heading hierarchy, link text, ARIA/alt/form labels, `lang`. Returns violations, score, screen-reader previews, and per-violation confidence.
2. **Prioritize** — `POST /api/prioritize` groups violations by category and ranks by user impact. Requires `consentToAi: true` to send code to the model; otherwise returns a 403.
3. **Fix** — `POST /api/pr` fetches affected files, generates diffs, commits to branch `a11y-fix-<category>`, and opens a PR. `dryRun: true` returns diffs without committing.
4. **Report** — `POST /api/report` and `/api/report/pdf` emit HTML/PDF summaries; `POST /api/badge` (or `GET`) emits an SVG score badge.

## Scanner Reference

| Check                   | WCAG Criterion | File Types                  | Approach                                                 |
| ----------------------- | -------------- | --------------------------- | -------------------------------------------------------- |
| Color contrast          | 1.4.3 (AA)     | CSS, JSX, TSX               | CSS property inspection, inline style parse              |
| Keyboard trap           | 2.1.2 (AA)     | HTML, JSX, TSX              | Event handler / tabindex analysis                        |
| Heading hierarchy       | 1.3.1 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST traversal (`h1`–`h6` nesting)                        |
| Link text               | 2.4.4 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST + regex for empty/homogeneous links                  |
| ARIA attributes         | 4.1.2 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST validation of required ARIA props                    |
| Image alt text          | 1.1.1 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST check for missing/empty `alt`                        |
| Form label              | 1.3.1 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST matching `<label for>` / `aria-label`                |
| Language attribute      | 3.1.1 (AA)     | HTML, JSX, TSX              | Regex + AST for missing `<html lang>`                    |
| Focus order             | 2.4.3 (AA)     | HTML, JSX, TSX, Vue         | Tabindex-positive-value detection                        |
| Non-text content        | 1.1.1 (AA)     | HTML, JSX, TSX, Vue, Svelte | AST for missing alt on `<area>`, `<input type=image>`    |
| Error identification    | 3.3.1 (AA)     | HTML, JSX, TSX              | AST for missing `aria-describedby` / `aria-errormessage` |
| Sensory characteristics | 1.3.3 (AA)     | HTML, JSX, TSX, Vue, Svelte | Regex for direction-only instructions                    |

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add keys below
npm run dev                        # http://localhost:3000
```

Env vars (`.env.local`):

| Variable         | Required | Purpose                                                                             |
| ---------------- | -------- | ----------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`   | Yes      | PAT with `repo` scope for tree/commit/PR operations.                                |
| `OPENAI_API_KEY` | No       | Enables OpenAI model grouping + fix explanations. Deterministic fallback if absent. |

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

## API usage examples

**Scan a repo:**

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d '{"repoUrl": "https://github.com/mahesh-diwan/a11y-forge"}'
```

**Prioritize violations:**

```bash
curl -X POST http://localhost:3000/api/prioritize \
  -H "Content-Type: application/json" \
  -d '{"violations": [...], "consentToAi": true}'
```

**Create fix PR (dry run):**

```bash
curl -X POST http://localhost:3000/api/pr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d '{"repoUrl": "https://github.com/mahesh-diwan/a11y-forge", "group": {...}, "dryRun": true, "consentToAi": true}'
```

**Generate HTML report:**

```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{...scan result...}' \
  -o report.html
```

**Generate PDF report:**

```bash
curl -X POST http://localhost:3000/api/report/pdf \
  -H "Content-Type: application/json" \
  -d '{...scan result with score...}' \
  -o report.pdf
```

**Get badge:**

```bash
curl http://localhost:3000/api/badge
```

## Demo

Try the live demo on the homepage (`http://localhost:3000`). Enter a public GitHub repo URL and click "Scan". The forge runs the full pipeline: scan, prioritize, and show results in an interactive report with score card, violation list, and screen reader preview. Use "Create PR" buttons to open fix PRs directly. The **Try Demo** button on the docs page loads a pre-configured example repo for an instant walkthrough.

## Project structure

```
src/
├── app/api/
│   ├── scan/route.ts        # repo tree walk + violation detection
│   ├── prioritize/route.ts  # OpenAI model grouping + deterministic fallback
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
| `npm test`      | Run vitest suite (165+ tests, 32 files)    |
| `npm run lint`  | ESLint                                     |

## Tech stack

Next.js 16.2 (App Router) · TypeScript 5 · Tailwind v4 · Octokit v5 (Git Data API) · OpenAI SDK (OpenAI model) · @babel/parser (AST) · pdf-lib · mermaid · vitest + playwright.

## Local development

Refer to `docs/` for in-depth guides:

- `docs/ARCHITECTURE.md` — pipeline design, data flow, and module responsibilities
- `docs/SCANNER.md` — adding new check types, tuning detection
- `docs/DEPLOYMENT.md` — production hosting, environment configuration

## Security notes

- **Rate limit** — 20 requests/minute per IP, in-memory (note serverless limitation: counter resets per instance). Excess returns 429 with `Retry-After: 60`. Body capped at 500 KB, total payload at 2 MB.
- **Consent** — AI endpoints (`/api/prioritize`, `/api/pr`) require `consentToAi: true`. Without it, no code leaves the server for model processing (403).
- **No private code without opt-in** — only public repos are scanned. The GitHub token is server-side only; source is never sent to OpenAI unless `consentToAi` is set.
- **Public repos only** — scans require repo read access via the supplied token; inaccessible/private repos return 403.
