# Accessibility Forge — API Reference

Base URL: `https://accessibility-forge.vercel.app/api`

## Overview

| Route             | Method     | Purpose                                          |
| ----------------- | ---------- | ------------------------------------------------ |
| `/api/scan`       | POST       | Scan repository for WCAG violations              |
| `/api/prioritize` | POST       | Group violations into prioritized fix categories |
| `/api/pr`         | POST       | Create GitHub PR with automated fixes            |
| `/api/report`     | POST       | Generate downloadable HTML accessibility report  |
| `/api/report/pdf` | POST       | Generate downloadable PDF accessibility report   |
| `/api/badge`      | POST / GET | Generate SVG score badge                         |

---

## Types

Shared types used across all endpoints. Defined in `src/lib/types.ts`.

### Violation

```typescript
interface Violation {
  type: string; // e.g. "missing-alt-text"
  file: string; // relative file path in repo
  line: number; // line number where violation occurs
  description: string; // human-readable description
  snippet?: string; // optional code excerpt
}
```

### ScoreResult

```typescript
interface ScoreResult {
  score: number; // 0–100
  grade: string; // "A", "B", "C", "D", "F"
  label: string; // short label like "Needs work"
  color: string; // hex color for badge
  totalViolations: number;
  breakdown: { type: string; count: number; impact: number }[];
  affectedFiles: string[];
}
```

### ScreenReaderOutput

```typescript
interface ScreenReaderOutput {
  file: string;
  line: number;
  element: string; // HTML element tag or selector
  current: string; // what screen reader currently announces
  fixed: string; // what screen reader would announce after fix
  violation: string; // related violation type
}
```

### ConfidenceResult

```typescript
interface ConfidenceResult {
  violation: Violation;
  confidence: number; // 0.0–1.0
  reasoning: string; // why the scanner is confident (or not)
}
```

### FixGroup

```typescript
interface FixGroup {
  category: string; // e.g. "Missing Alt Text"
  violations: Violation[];
  reasoning: string; // human-impact explanation
}
```

### FixDiff

```typescript
interface FixDiff {
  file: string;
  before: string; // original file content
  after: string; // fixed file content
}
```

### FixPR

```typescript
interface FixPR {
  category: string;
  url?: string; // PR URL (absent in dry-run or error)
  number?: number; // PR number (absent in dry-run or error)
  fixCount?: number;
  error?: string;
  explanation?: string;
  dryRun?: boolean;
  diffs?: FixDiff[];
}
```

### ScanResult

```typescript
interface ScanResult {
  repoUrl: string;
  violations: Violation[];
  score?: ScoreResult;
  screenReader?: ScreenReaderOutput[];
  confidence?: ConfidenceResult[];
}
```

---

## `POST /api/scan`

Scan a GitHub repository for WCAG accessibility violations.

### Description

Clones the target repo, runs static analysis against WCAG criteria, computes an accessibility score (0–100), generates screen reader previews, and scores confidence for each detection. Requires `GITHUB_TOKEN` env var on server.

### Request Body

```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

### Responses

#### 200 — Scan complete

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "violations": [
    {
      "type": "missing-alt-text",
      "file": "src/components/Hero.jsx",
      "line": 12,
      "description": "Image missing alt attribute",
      "snippet": "<img src=\"/hero.jpg\" />"
    }
  ],
  "score": {
    "score": 64,
    "grade": "D",
    "label": "Needs work",
    "color": "#eab308",
    "totalViolations": 14,
    "breakdown": [{ "type": "missing-alt-text", "count": 5, "impact": 0.8 }],
    "affectedFiles": ["src/components/Hero.jsx"]
  },
  "screenReader": [
    {
      "file": "src/components/Hero.jsx",
      "line": 12,
      "element": "<img>",
      "current": "image",
      "fixed": "Hero banner: Welcome to our site",
      "violation": "missing-alt-text"
    }
  ],
  "confidence": [
    {
      "violation": {
        "type": "missing-alt-text",
        "file": "...",
        "line": 12,
        "description": "..."
      },
      "confidence": 0.95,
      "reasoning": "Element is an <img> with no alt attribute"
    }
  ]
}
```

#### 400 — Missing repoUrl

```json
{ "error": "repoUrl required" }
```

#### 500 — Server error

```json
{ "error": "GITHUB_TOKEN not configured" }
```

```json
{ "error": "<message>", "violations": [] }
```

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/scan \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/vercel/next.js"}'
```

---

## `POST /api/prioritize`

Group WCAG violations into prioritized fix categories.

### Description

Takes a flat list of violations and groups them by similarity (e.g., all missing-alt-text together). Groups are ordered by user impact (critical first). Each group includes human-impact reasoning.

Uses GPT-5.6 for intelligent grouping when `OPENAI_API_KEY` is configured. Falls back to deterministic type-based grouping when AI is unavailable.

### Request Body

```json
{
  "violations": [
    {
      "type": "missing-alt-text",
      "file": "src/Hero.jsx",
      "line": 12,
      "description": "Image missing alt attribute"
    },
    {
      "type": "missing-aria-label",
      "file": "src/Nav.tsx",
      "line": 34,
      "description": "Button missing aria-label"
    }
  ]
}
```

### Responses

#### 200 — Grouping complete

```json
{
  "groups": [
    {
      "category": "Missing Alt Text",
      "reasoning": "Screen readers cannot describe images without alt text. Affects all visually impaired users.",
      "violations": [
        {
          "type": "missing-alt-text",
          "file": "src/Hero.jsx",
          "line": 12,
          "description": "Image missing alt attribute"
        }
      ]
    },
    {
      "category": "Missing Aria Label",
      "reasoning": "Interactive elements without text or labels are inaccessible to screen reader users.",
      "violations": [
        {
          "type": "missing-aria-label",
          "file": "src/Nav.tsx",
          "line": 34,
          "description": "Button missing aria-label"
        }
      ]
    }
  ]
}
```

#### 200 — Empty violations

```json
{ "groups": [] }
```

#### 500 — Server error

```json
{ "error": "<message>", "groups": [] }
```

### Fallback priority order (deterministic mode)

1. `missing-alt-text`
2. `missing-aria-label`
3. `missing-form-label`
4. `missing-html-lang`
5. `potential-contrast-issue`

Unknown types sort last (priority 99).

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/prioritize \
  -H "Content-Type: application/json" \
  -d '{"violations": [{"type": "missing-alt-text", "file": "src/Hero.jsx", "line": 12, "description": "Image missing alt"}]}'
```

---

## `POST /api/pr`

Create a GitHub Pull Request with automated accessibility fixes.

### Description

Takes a prioritized fix group, fetches affected file contents from GitHub, generates fixes (via GPT-5.6 or deterministic regex fallback), creates a new branch, commits the fixes, and opens a PR. Supports `dryRun` mode to preview diffs without creating a PR.

Optional GPT-5.6 plain-English explanations per violation are appended to the PR body.

### Request Body

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "group": {
    "category": "Missing Alt Text",
    "reasoning": "Screen readers cannot describe images without alt text.",
    "violations": [
      {
        "type": "missing-alt-text",
        "file": "src/Hero.jsx",
        "line": 12,
        "description": "Image missing alt attribute"
      }
    ]
  },
  "dryRun": false
}
```

`dryRun` (optional, default `false`) — when `true`, returns diffs without creating branch or PR.

### Responses

#### 200 — PR created

```json
{
  "category": "Missing Alt Text",
  "url": "https://github.com/owner/repo/pull/42",
  "number": 42,
  "fixCount": 3,
  "explanation": "Added descriptive alt text to all images.\nAdded aria-labels to navigation buttons.",
  "diffs": [
    {
      "file": "src/Hero.jsx",
      "before": "<img src=\"/hero.jpg\" />",
      "after": "<img src=\"/hero.jpg\" alt=\"Hero banner\" />"
    }
  ]
}
```

#### 200 — Dry run

```json
{
  "category": "Missing Alt Text",
  "dryRun": true,
  "fixCount": 3,
  "diffs": [],
  "explanation": "Generated fixes with GPT-5.6."
}
```

#### 400 — Invalid request

```json
{ "category": "", "error": "Invalid fix group" }
```

```json
{ "category": "Missing Alt Text", "error": "Invalid repo URL" }
```

```json
{ "category": "Missing Alt Text", "error": "No fixes generated" }
```

#### 500 — Server error

```json
{ "category": "", "error": "GITHUB_TOKEN not configured" }
```

```json
{ "category": "", "error": "<message>" }
```

### Branch naming

Branches follow pattern: `a11y-fix-<category-slug>`

Example: `a11y-fix-missing-alt-text`

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/pr \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/owner/repo",
    "group": {
      "category": "Missing Alt Text",
      "reasoning": "Screen readers cannot describe images without alt text.",
      "violations": [
        {"type": "missing-alt-text", "file": "src/Hero.jsx", "line": 12, "description": "Image missing alt attribute"}
      ]
    }
  }'
```

---

## `POST /api/report`

Generate downloadable HTML accessibility report.

### Description

Accepts a full `ScanResult` object and returns an HTML document with formatted report. Response is served as a file download (`Content-Disposition: attachment`).

### Request Body

Full `ScanResult` JSON (see [ScanResult type](#scanresult)).

### Responses

#### 200 — HTML report

- **Content-Type:** `text/html; charset=utf-8`
- **Content-Disposition:** `attachment; filename="a11y-report-<timestamp>.html"`
- **Body:** Complete HTML document with formatted report

#### 500 — Server error

```json
{ "error": "Report generation failed" }
```

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/report \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/owner/repo", "violations": [], "score": {"score": 85, "grade": "B", "label": "Good", "color": "#22c55e", "totalViolations": 3, "breakdown": [], "affectedFiles": []}}' \
  -o report.html
```

---

## `POST /api/report/pdf`

Generate downloadable PDF accessibility report.

### Description

Accepts a full `ScanResult` object and returns a PDF document. Response is served as a file download.

### Request Body

Full `ScanResult` JSON (see [ScanResult type](#scanresult)). Must include `score` field.

### Responses

#### 200 — PDF report

- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="a11y-report-<timestamp>.pdf"`
- **Body:** PDF binary

#### 400 — Invalid payload

```json
{ "error": "Invalid report payload" }
```

#### 500 — Server error

```json
{ "error": "<message>" }
```

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/report/pdf \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/owner/repo", "violations": [], "score": {"score": 85, "grade": "B", "label": "Good", "color": "#22c55e", "totalViolations": 3, "breakdown": [], "affectedFiles": []}}' \
  -o report.pdf
```

---

## `POST /api/badge`

Generate SVG accessibility score badge (dynamic score).

### Description

Accepts a `ScoreResult` and returns an SVG badge image. Cached by CDN for 24 hours.

### Request Body

```json
{
  "score": {
    "score": 64,
    "grade": "D",
    "label": "Needs work",
    "color": "#eab308",
    "totalViolations": 14,
    "breakdown": [],
    "affectedFiles": []
  }
}
```

### Responses

#### 200 — SVG badge

- **Content-Type:** `image/svg+xml`
- **Cache-Control:** `public, max-age=86400`
- **Body:** SVG image

#### 400 — Invalid score

```json
{ "error": "Invalid score data" }
```

#### 500 — Server error

```json
{ "error": "Badge generation failed" }
```

### Example

```bash
curl -X POST https://accessibility-forge.vercel.app/api/badge \
  -H "Content-Type: application/json" \
  -d '{"score": {"score": 64, "grade": "D", "label": "Needs work", "color": "#eab308", "totalViolations": 14, "breakdown": [], "affectedFiles": []}}' \
  -o badge.svg
```

---

## `GET /api/badge`

Generate SVG accessibility score badge (default/placeholder).

### Description

Returns a gray "Not scanned" badge. Useful as a fallback or placeholder in README badges before scan is run.

### Responses

#### 200 — SVG badge

- **Content-Type:** `image/svg+xml`
- **Body:** SVG with score `0`, grade `?`, label `"Not scanned"`, color `#6b7280`

### Example

```markdown
![Accessibility](https://accessibility-forge.vercel.app/api/badge)
```

```bash
curl https://accessibility-forge.vercel.app/api/badge -o badge.svg
```

---

## Error Handling

All endpoints follow consistent error shape:

| Status | Meaning                                                                |
| ------ | ---------------------------------------------------------------------- |
| `200`  | Success                                                                |
| `400`  | Bad request — missing or invalid input                                 |
| `500`  | Server error — missing env vars, GitHub API failure, or internal error |

Error responses from `400` and `500`:

```json
{ "error": "<human-readable message>" }
```

Some endpoints include additional fields on error (e.g., `/api/scan` returns `violations: []`, `/api/prioritize` returns `groups: []`, `/api/pr` returns `category: ""`).

## Authentication

API routes are **unauthenticated** at the application layer. Authentication is enforced via:

- **`GITHUB_TOKEN`** (server env) — required by `/api/scan` and `/api/pr` for GitHub API access
- **`OPENAI_API_KEY`** (server env) — optional, enables GPT-5.6 grouping and explanation features. Routes fall back to deterministic logic when absent.
