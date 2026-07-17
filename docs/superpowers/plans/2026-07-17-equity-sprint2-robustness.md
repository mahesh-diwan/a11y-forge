# equity Sprint 2: System Robustness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the stateless API + UI: error boundaries, zod validation, GitHub caching, structured logging, rate-limit docs, performance — no DB/auth/CI.

**Architecture:** New `lib/cache.ts`, `lib/logger.ts`, `lib/validation.ts`, `components/ErrorBoundary.tsx`. Wire into existing API routes + `github.ts`. Keep API response shapes + data layer unchanged.

**Tech Stack:** Next 16, zod, React error boundary, in-memory Map cache, structured console logging.

## Global Constraints

- Keep `scanRepo` / `runWorkflow` / API response shapes unchanged.
- WCAG AA minimum. Dark-only. No DB/auth/CI.
- 54 tests stay green; add coverage toward >80%.
- Custom motion `cubic-bezier(0.32,0.72,0,1)` 250ms.
- Banned fonts not used.

---

### Task 1: Error boundary component

**Files:**

- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/page.tsx` (wrap `<main>`)

**Interfaces:**

- Consumes: none.
- Produces: `ErrorBoundary` class component with `fallback` prop.

- [ ] **Step 1: Write ErrorBoundary.tsx**

```tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="mx-auto max-w-md p-8 text-center">
            <h2
              className="font-display text-2xl font-bold"
              style={{ color: "var(--color-fail)" }}
            >
              Something broke.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              {this.state.message || "An unexpected error occurred. Try again."}
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap main in page.tsx**

In `src/app/page.tsx`, wrap `<main>...</main>` content (or the inner sections) with `<ErrorBoundary>`. Add import.

- [ ] **Step 3: Test render**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm test 2>&1 | tail -4`
Expected: 54 pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/app/page.tsx
git commit -m "feat: add ErrorBoundary around main"
```

### Task 2: zod validation schemas

**Files:**

- Create: `src/lib/validation.ts`
- Modify: `src/app/api/scan/route.ts`, `prioritize/route.ts`, `pr/route.ts` (add schema check inside existing guard flow)

**Interfaces:**

- Consumes: request bodies.
- Produces: `validateScan`, `validatePrioritize`, `validatePr` functions returning parsed data or throwing.

- [ ] **Step 1: Write validation.ts**

```ts
import { z } from "zod";

export const scanSchema = z.object({
  repoUrl: z.string().regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
});

export const prioritizeSchema = z.object({
  violations: z
    .array(
      z
        .object({ type: z.string(), file: z.string(), line: z.number() })
        .passthrough(),
    )
    .min(1),
  consentToAi: z.literal(true),
});

export const prSchema = z.object({
  repoUrl: z.string().regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
  group: z
    .object({ category: z.string(), violations: z.array(z.any()).min(1) })
    .passthrough(),
  dryRun: z.boolean().optional(),
  consentToAi: z.literal(true),
});
```

- [ ] **Step 2: Use in routes**

In each route, after `guardAndParse`, run `scanSchema.parse(parsed.data)` (catch → `apiError("VALIDATION_ERROR", ...)`). Keep `consentToAi` literal(true) check.

- [ ] **Step 3: Add a test**

Create `src/lib/validation.test.ts` testing `scanSchema` accepts valid, rejects invalid.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts src/app/api/scan/route.ts src/app/api/prioritize/route.ts src/app/api/pr/route.ts
git commit -m "feat: zod validation on API routes"
```

### Task 3: GitHub fetch caching

**Files:**

- Create: `src/lib/cache.ts`
- Modify: `src/lib/github.ts` (`fetchFile` + scan path)

**Interfaces:**

- Consumes: octokit fetch.
- Produces: `getCached`, `setCached` with TTL.

- [ ] **Step 1: Write cache.ts**

```ts
const store = new Map<string, { value: unknown; exp: number }>();
const TTL = 5 * 60 * 1000;

export function cacheGet(key: string): unknown | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.exp) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function cacheSet(key: string, value: unknown): void {
  store.set(key, { value, exp: Date.now() + TTL });
}
```

- [ ] **Step 2: Wrap fetchFile**

In `github.ts fetchFile`, key = `${owner}/${repo}/${path}`. On success `cacheSet(key, content)`; on read `cacheGet` first.

- [ ] **Step 3: Test**

Add `src/lib/cache.test.ts` (set/get/expire).

- [ ] **Step 4: Commit**

```bash
git add src/lib/cache.ts src/lib/cache.test.ts src/lib/github.ts
git commit -m "feat: cache GitHub file fetches (5m TTL)"
```

### Task 4: Structured logging

**Files:**

- Create: `src/lib/logger.ts`
- Modify: `src/app/api/scan/route.ts`, `prioritize/route.ts`, `pr/route.ts`, `report/route.ts`, `report/pdf/route.ts`, `badge/route.ts`

**Interfaces:**

- Consumes: request.
- Produces: `logRequest(route, status, ms)`.

- [ ] **Step 1: Write logger.ts**

```ts
export function logRequest(
  route: string,
  status: number,
  ms: number,
  meta?: Record<string, unknown>,
) {
  console.log(
    JSON.stringify({ t: new Date().toISOString(), route, status, ms, ...meta }),
  );
}
```

- [ ] **Step 2: Wrap routes**

In each route, capture `const start = Date.now()` at top, call `logRequest` in finally (status from response or error).

- [ ] **Step 3: Commit**

```bash
git add src/lib/logger.ts src/app/api/*/route.ts
git commit -m "feat: structured request logging"
```

### Task 5: Rate-limit hardening + docs

**Files:**

- Modify: `src/lib/rate-limit.ts`, `README.md`

**Interfaces:**

- Consumes: existing.
- Produces: documented limitation.

- [ ] **Step 1: Add store interface comment + Retry-After already present**

In `rate-limit.ts` add comment: "In-memory; shared across serverless instances. Swap `hits` Map for KV (Redis/Upstash) in production." Keep logic.

- [ ] **Step 2: Document in README**

Add "Rate limiting: 20 req/min per IP, in-memory (note serverless limitation)" to Security section.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts README.md
git commit -m "docs: rate-limit production note"
```

### Task 6: Performance pass

**Files:**

- Modify: `next.config.ts` (fonts), `src/app/page.tsx` (code-split if needed)

**Interfaces:**

- Consumes: existing.
- Produces: smaller bundles.

- [ ] **Step 1: Ensure font display swap**

If using `next/font`, set `display: "swap"`. Verify in `layout.tsx` / globals.

- [ ] **Step 2: Lazy Dashboard/ForgeHero if heavy**

`ForgeHero` already client; HeroScene lazy (Sprint 1). No change unless bundle audit shows issue.

- [ ] **Step 3: Commit + build**

```bash
git add -A && git commit -m "perf: font swap + lazy 3D" && npm run build 2>&1 | tail -8
```

### Task 7: Full test + coverage gate

**Files:**

- None new.

- [ ] **Step 1: Run tests**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm test 2>&1 | tail -6`
Expected: tests pass, count increased from 54.

- [ ] **Step 2: Commit gate**

```bash
git add -A && git commit -m "test: sprint 2 green gate" || echo "nothing"
```
