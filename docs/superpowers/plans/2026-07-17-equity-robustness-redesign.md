# equity Robustness Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden equity full-stack across 6 axes — error handling, observability, security, performance, testing, deploy safety.

**Architecture:** Typed `AppError` hierarchy + `withErrorHandler` route edge; Sentry (server `instrumentation.ts` + browser `layout.tsx`); CSP/security headers via `middleware.ts`; `RateLimiter` interface (in-memory, Redis-ready); streaming scan + request coalescing; unit→80% + API integration + Playwright e2e; `DEPLOY.md` + `/api/health` + env validation.

**Tech Stack:** Next 16.2.10, React 19, TypeScript 5, vitest 4, @sentry/nextjs, @playwright/test, zod 4, three/R3F (existing).

## Global Constraints

- Keep `scanRepo` / `runWorkflow` / API response shapes compatible (streaming is additive).
- Dark-only theme, amber `#ffb700` on ink `#0a0908`, Syne/DM Sans/JetBrains Mono.
- WCAG AA minimum (contrast, focus, reduced-motion).
- No new DB, no auth change (env token kept).
- 80% line coverage gate.
- Tailwind v4 tokens in `globals.css`.
- Custom motion `cubic-bezier(0.32,0.72,0,1)`, 250ms.
- Banned fonts not used.
- Sentry is optional (DSN env may be absent → no-op).
- All routes return `{ error: { code, message, errorId } }` on failure.

## Workstreams (parallel-executable)

| WS  | Name           | Phase skill          | Files                                                                                  | Deps        |
| --- | -------------- | -------------------- | -------------------------------------------------------------------------------------- | ----------- |
| A   | Error handling | systematic-debugging | errors.ts, route-handler.ts, 6 routes                                                  | none        |
| B   | Observability  | observability        | logger.ts, sentry.ts, instrumentation.ts, layout.tsx, ErrorBoundary.tsx                | A (errorId) |
| C   | Security       | security             | security-headers.ts, middleware.ts, rate-limit.ts, validation.ts, env.ts               | none        |
| D   | Performance    | performance          | coalesce.ts, scanner.ts, cache.ts, HeroScene.tsx, next.config.ts, scan route streaming | C (headers) |
| E   | Testing        | testing              | unit tests, integration tests, e2e, vitest.config, coverage                            | A,B,C,D     |
| F   | Deploy docs    | (docs)               | DEPLOY.md, health route, size-limit.json                                               | A,C         |

WS B depends on A (errorId in response). WS D depends on C (headers in middleware). WS E depends on all. WS F depends on A,C.

Execute order: **A, C in parallel** → **B, D in parallel** (after A,C) → **F** → **E last** (needs all code present).

---

## Workstream A — Error Handling

### Task A1: Typed error hierarchy

**Files:**

- Create: `src/lib/errors.ts`
- Test: `src/lib/errors.test.ts`

**Interfaces:**

- Consumes: none.
- Produces: `AppError` base + `ValidationError`, `RateLimitError`, `GitHubError`, `OpenAIError`, `ScanError`, `ConfigError`. `errorId` generator.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  GitHubError,
  errorId,
  isAppError,
} from "./errors";

describe("AppError", () => {
  it("carries code/status/safeMessage/errorId", () => {
    const e = new ValidationError("bad url");
    expect(e.code).toBe("VALIDATION_ERROR");
    expect(e.status).toBe(400);
    expect(e.safeMessage).toBe("bad url");
    expect(typeof e.errorId).toBe("string");
    expect(e.errorId.length).toBeGreaterThan(0);
  });
  it("GitHubError maps to 502", () => {
    const e = new GitHubError("api down");
    expect(e.status).toBe(502);
    expect(e.code).toBe("GITHUB_ERROR");
  });
  it("isAppError narrows", () => {
    expect(isAppError(new ValidationError("x"))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });
  it("errorId unique", () => {
    expect(errorId()).not.toBe(errorId());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/errors.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write implementation**

```ts
export function errorId(): string {
  return (
    crypto.randomUUID?.() ??
    `e_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

export interface AppErrorInit {
  code: string;
  status: number;
  safeMessage: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly safeMessage: string;
  readonly details?: unknown;
  readonly errorId: string;

  constructor(init: AppErrorInit) {
    super(init.safeMessage);
    this.name = "AppError";
    this.code = init.code;
    this.status = init.status;
    this.safeMessage = init.safeMessage;
    this.details = init.details;
    this.errorId = errorId();
    if (init.cause) (this as any).cause = init.cause;
  }
}

export class ValidationError extends AppError {
  constructor(safeMessage: string, details?: unknown) {
    super({ code: "VALIDATION_ERROR", status: 400, safeMessage, details });
  }
}
export class RateLimitError extends AppError {
  constructor(safeMessage = "Too many requests. Try again later.") {
    super({ code: "RATE_LIMITED", status: 429, safeMessage });
  }
}
export class GitHubError extends AppError {
  constructor(
    safeMessage = "GitHub API request failed",
    details?: unknown,
    cause?: unknown,
  ) {
    super({ code: "GITHUB_ERROR", status: 502, safeMessage, details, cause });
  }
}
export class OpenAIError extends AppError {
  constructor(
    safeMessage = "AI fix generation failed",
    details?: unknown,
    cause?: unknown,
  ) {
    super({ code: "OPENAI_ERROR", status: 502, safeMessage, details, cause });
  }
}
export class ScanError extends AppError {
  constructor(safeMessage = "Scan failed", details?: unknown, cause?: unknown) {
    super({ code: "SCAN_FAILED", status: 500, safeMessage, details, cause });
  }
}
export class ConfigError extends AppError {
  constructor(safeMessage: string) {
    super({ code: "CONFIG_ERROR", status: 500, safeMessage });
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/errors.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts src/lib/errors.test.ts
git commit -m "feat: typed AppError hierarchy"
```

### Task A2: Route edge wrapper

**Files:**

- Create: `src/lib/route-handler.ts`

**Interfaces:**

- Consumes: `AppError` (A1), `logRequest` (B1), `Sentry` (B2 — import lazily to avoid hard dep).
- Produces: `withErrorHandler(fn)` used by all routes.

- [ ] **Step 1: Write implementation**

```ts
import { NextRequest, NextResponse } from "next/server";
import { AppError, isAppError } from "./errors";
import { logRequest } from "./logger";

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(handler: Handler): Handler {
  return async (req: NextRequest) => {
    const start = Date.now();
    const route = req.nextUrl.pathname;
    try {
      const res = await handler(req);
      logRequest(route, res.status, Date.now() - start);
      return res;
    } catch (err) {
      const appErr = isAppError(err)
        ? err
        : new AppError({
            code: "INTERNAL_ERROR",
            status: 500,
            safeMessage: "Unexpected error",
            details: String(err),
            cause: err,
          });
      // Sentry (optional). Guarded import avoids hard dep when DSN unset.
      try {
        const { captureException } = await import("./sentry");
        captureException(err, { tags: { route, errorId: appErr.errorId } });
      } catch {
        /* sentry optional */
      }
      logRequest(route, appErr.status, Date.now() - start, {
        code: appErr.code,
        errorId: appErr.errorId,
      });
      return NextResponse.json(
        {
          error: {
            code: appErr.code,
            message: appErr.safeMessage,
            errorId: appErr.errorId,
          },
        },
        { status: appErr.status },
      );
    }
  };
}
```

- [ ] **Step 2: Verify typechecks**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit 2>&1 | head`
Expected: no errors for route-handler.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/route-handler.ts
git commit -m "feat: withErrorHandler route edge"
```

### Task A3: Migrate 6 routes to AppError + wrapper

**Files:**

- Modify: `src/app/api/scan/route.ts`, `prioritize/route.ts`, `pr/route.ts`, `report/route.ts`, `report/pdf/route.ts`, `badge/route.ts`
- Delete: `src/lib/api-error.ts` (replaced)

**Interfaces:**

- Consumes: `withErrorHandler`, `AppError` subclasses.
- Produces: routes throw `AppError` instead of returning `apiError(...)`.

- [ ] **Step 1: Rewrite scan route**

Replace `src/app/api/scan/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { scanRepo } from "@/lib/scanner";
import { calculateScore } from "@/lib/score";
import { generateScreenReaderPreview } from "@/lib/screen-reader";
import { scoreConfidence } from "@/lib/confidence";
import { guardAndParse } from "@/lib/request-guard";
import { scanSchema } from "@/lib/validation";
import { withErrorHandler } from "@/lib/route-handler";
import { ValidationError, ConfigError, ScanError } from "@/lib/errors";

async function handle(req: NextRequest) {
  const parsed = await guardAndParse<{ repoUrl?: string }>(req);
  if (parsed.error)
    throw new ValidationError("Invalid request", { raw: parsed.error.status });
  const zod = scanSchema.safeParse(parsed.data);
  if (!zod.success)
    throw new ValidationError("Invalid repo URL", zod.error.flatten());
  const { repoUrl } = zod.data;

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new ConfigError("GITHUB_TOKEN not configured");

  const violations = await scanRepo(repoUrl, token);
  const score = calculateScore(violations);
  const screenReader = generateScreenReaderPreview(violations);
  const confidence = scoreConfidence(violations);

  return NextResponse.json({
    repoUrl,
    violations,
    score,
    screenReader,
    confidence,
  });
}

export const POST = withErrorHandler(handle);
```

- [ ] **Step 2: Apply same pattern to prioritize/pr/report/report-pdf/badge**

For each: import `withErrorHandler` + relevant `AppError` subclass (e.g. `pr` route uses `ValidationError`, `GitHubError`, `ConfigError`, `OpenAIError`). Replace `apiError(...)` returns with `throw new XError(...)`. Wrap export: `export const POST = withErrorHandler(handle);`. Keep `guardAndParse` + zod checks.

- [ ] **Step 3: Delete api-error.ts**

Run: `rm src/lib/api-error.ts` (verify no other importers via grep first).

- [ ] **Step 4: Verify build + tests**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; existing tests pass (validation.test etc. unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "refactor: routes use AppError + withErrorHandler"
```

---

## Workstream B — Observability

### Task B1: Structured logger

**Files:**

- Modify: `src/lib/logger.ts`
- Test: `src/lib/logger.test.ts`

**Interfaces:**

- Consumes: none.
- Produces: `logRequest(route, status, ms, opts?)`, `logError(errorId, err, opts?)`.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { logRequest, logError } from "./logger";

describe("logger", () => {
  it("logRequest emits JSON with fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logRequest("/api/scan", 200, 12, { errorId: "e1" });
    const out = JSON.parse(spy.mock.calls[0][0] as string);
    expect(out.route).toBe("/api/scan");
    expect(out.status).toBe(200);
    expect(out.ms).toBe(12);
    expect(out.errorId).toBe("e1");
    expect(out.level).toBe("info");
    spy.mockRestore();
  });
  it("logError emits level error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("e2", new Error("boom"));
    const out = JSON.parse(spy.mock.calls[0][0] as string);
    expect(out.level).toBe("error");
    expect(out.errorId).toBe("e2");
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/logger.test.ts`
Expected: FAIL

- [ ] **Step 3: Rewrite logger**

```ts
type Meta = Record<string, unknown> | undefined;

export function logRequest(
  route: string,
  status: number,
  ms: number,
  meta?: Meta,
): void {
  console.log(
    JSON.stringify({
      t: new Date().toISOString(),
      level: "info",
      route,
      status,
      ms,
      ...meta,
    }),
  );
}
export function logError(errorId: string, err: unknown, meta?: Meta): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      t: new Date().toISOString(),
      level: "error",
      errorId,
      message: msg,
      ...meta,
    }),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/logger.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts src/lib/logger.test.ts
git commit -m "feat: structured logger"
```

### Task B2: Sentry init (server + browser)

**Files:**

- Create: `src/lib/sentry.ts`, `src/instrumentation.ts`
- Modify: `src/app/layout.tsx`
- Deps: `@sentry/nextjs`

**Interfaces:**

- Consumes: none (optional DSN).
- Produces: `captureException(err, opts?)`, `Sentry` re-export for browser.

- [ ] **Step 1: Install dep**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm install @sentry/nextjs@^9`

- [ ] **Step 2: Write sentry.ts**

```ts
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (dsn && typeof window === "undefined") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}

export function captureException(
  err: unknown,
  opts?: { tags?: Record<string, string> },
): void {
  if (!dsn) return;
  Sentry.captureException(err, opts);
}
export { Sentry };
```

- [ ] **Step 3: Write instrumentation.ts**

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/sentry");
  }
}
```

- [ ] **Step 4: Wire browser Sentry in layout.tsx**

In `src/app/layout.tsx`, add at top (client boundary ok via `useEffect` or direct):

```tsx
import * as Sentry from "@sentry/nextjs";
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/sentry.ts src/instrumentation.ts src/app/layout.tsx package.json package-lock.json
git commit -m "feat: Sentry server + browser init (optional DSN)"
```

### Task B3: ErrorBoundary → Sentry

**Files:**

- Modify: `src/components/ErrorBoundary.tsx`

**Interfaces:**

- Consumes: `captureException` from `src/lib/sentry`.
- Produces: boundary reports to Sentry.

- [ ] **Step 1: Update componentDidCatch**

In `ErrorBoundary.tsx`, replace `console.error` with:

```tsx
componentDidCatch(error: Error) {
  import("@/lib/sentry").then(({ captureException }) => captureException(error, { tags: { boundary: "main" } })).catch(() => {});
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat: ErrorBoundary reports to Sentry"
```

---

## Workstream C — Security

### Task C1: Security headers + middleware

**Files:**

- Create: `src/lib/security-headers.ts`, `src/middleware.ts`
- Test: `src/lib/security-headers.test.ts`

**Interfaces:**

- Consumes: none.
- Produces: `buildSecurityHeaders(env)` → `Headers`, `middleware(req)` applies them + rate-limit.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildSecurityHeaders } from "./security-headers";

describe("security-headers", () => {
  it("sets CSP + frame-deny + nosniff", () => {
    const h = buildSecurityHeaders("production");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(h.get("Strict-Transport-Security")).toContain("max-age");
  });
  it("omits HSTS in dev", () => {
    const h = buildSecurityHeaders("development");
    expect(h.get("Strict-Transport-Security")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/security-headers.test.ts`
Expected: FAIL

- [ ] **Step 3: Write security-headers.ts**

```ts
export function buildSecurityHeaders(env: string): Headers {
  const h = new Headers();
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' api.openai.com api.github.com",
    "frame-ancestors 'none'",
  ].join("; ");
  h.set("Content-Security-Policy", csp);
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (env === "production") {
    h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  return h;
}
```

- [ ] **Step 4: Write middleware.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders } from "./security-headers";
import { RateLimiter, MemoryRateLimiter } from "./rate-limit";

const limiter = new MemoryRateLimiter();

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const headers = buildSecurityHeaders(process.env.NODE_ENV ?? "development");
  headers.forEach((v, k) => res.headers.set(k, v));

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const r = limiter.check(ip);
  res.headers.set("X-RateLimit-Remaining", String(r.remaining));
  if (!r.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again later.",
        },
      },
      { status: 429, headers: { "Retry-After": String(r.resetAfter) } },
    );
  }
  return res;
}

export const config = { matcher: ["/api/:path*"] };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/security-headers.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/security-headers.ts src/lib/security-headers.test.ts src/middleware.ts
git commit -m "feat: CSP + security headers via middleware"
```

### Task C2: RateLimiter interface

**Files:**

- Modify: `src/lib/rate-limit.ts`
- Test: `src/lib/rate-limit.test.ts`

**Interfaces:**

- Consumes: none.
- Produces: `RateLimiter` interface + `MemoryRateLimiter` impl (Redis-ready).

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { MemoryRateLimiter } from "./rate-limit";

describe("MemoryRateLimiter", () => {
  it("allows up to MAX then blocks", () => {
    const lim = new MemoryRateLimiter(2, 1000);
    expect(lim.check("a").allowed).toBe(true);
    expect(lim.check("a").allowed).toBe(true);
    expect(lim.check("a").allowed).toBe(false);
  });
  it("resets after window", () => {
    const lim = new MemoryRateLimiter(1, 10);
    expect(lim.check("b").allowed).toBe(false);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(lim.check("b").allowed).toBe(true);
        resolve();
      }, 20);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/rate-limit.test.ts`
Expected: FAIL

- [ ] **Step 3: Rewrite rate-limit.ts**

```ts
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfter: number;
}
export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private max = 20,
    private windowMs = 60_000,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || now > entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: this.max - 1,
        resetAfter: this.windowMs,
      };
    }
    entry.count++;
    if (entry.count > this.max) {
      return { allowed: false, remaining: 0, resetAfter: entry.resetAt - now };
    }
    return {
      allowed: true,
      remaining: this.max - entry.count,
      resetAfter: entry.resetAt - now,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/rate-limit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts
git commit -m "refactor: RateLimiter interface (Redis-ready)"
```

### Task C3: Validation caps + env validation

**Files:**

- Modify: `src/lib/validation.ts`
- Create: `src/lib/env.ts`

**Interfaces:**

- Consumes: none.
- Produces: capped zod schemas, `validateEnv()` boot check.

- [ ] **Step 1: Update validation.ts**

Add caps:

```ts
export const scanSchema = z.object({
  repoUrl: z
    .string()
    .max(2000)
    .regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
});
export const prioritizeSchema = z.object({
  violations: z
    .array(
      z
        .object({ type: z.string(), file: z.string(), line: z.number() })
        .passthrough(),
    )
    .min(1)
    .max(500),
  consentToAi: z.literal(true),
});
export const prSchema = z.object({
  repoUrl: z
    .string()
    .max(2000)
    .regex(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/),
  group: z
    .object({
      category: z.string().max(100),
      violations: z.array(z.any()).min(1).max(500),
    })
    .passthrough(),
  dryRun: z.boolean().optional(),
  consentToAi: z.literal(true),
});
```

- [ ] **Step 2: Write env.ts**

```ts
export function validateEnv(): void {
  const required = ["GITHUB_TOKEN"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run src/lib/validation.test.ts`
Expected: clean; validation tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validation.ts src/lib/env.ts
git commit -m "feat: validation caps + env validation"
```

---

## Workstream D — Performance

### Task D1: Request coalescing

**Files:**

- Create: `src/lib/coalesce.ts`
- Test: `src/lib/coalesce.test.ts`

**Interfaces:**

- Consumes: none.
- Produces: `coalesce(key, fn)` dedupes concurrent identical async calls.

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { coalesce } from "./coalesce";

describe("coalesce", () => {
  it("dedupes concurrent calls", async () => {
    const fn = vi.fn(async () => "result");
    const [a, b] = await Promise.all([coalesce("k", fn), coalesce("k", fn)]);
    expect(a).toBe("result");
    expect(b).toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("separate keys run separately", async () => {
    const fn = vi.fn(async (x: string) => x);
    const [a, b] = await Promise.all([
      coalesce("x", () => fn("x")),
      coalesce("y", () => fn("y")),
    ]);
    expect(a).toBe("x");
    expect(b).toBe("y");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/coalesce.test.ts`
Expected: FAIL

- [ ] **Step 3: Write coalesce.ts**

```ts
const inflight = new Map<string, Promise<unknown>>();

export function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/coalesce.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/coalesce.ts src/lib/coalesce.test.ts
git commit -m "feat: request coalescing for duplicate scans"
```

### Task D2: Scanner tuning + cache TTL

**Files:**

- Modify: `src/lib/scanner.ts`, `src/lib/cache.ts`

**Interfaces:**

- Consumes: `coalesce` (D1).
- Produces: `BATCH_SIZE 8`, `MAX_FILES 150`, cached scan via coalesce.

- [ ] **Step 1: Update cache.ts TTL**

In `src/lib/cache.ts` change `const TTL = 5 * 60 * 1000;` → `const TTL = 10 * 60 * 1000;`

- [ ] **Step 2: Update scanner.ts**

Change `const BRANCHES` block region: replace `slice(0, 100)` with `slice(0, 150)` and `const batchSize = 5;` with `const batchSize = 8;`.

Wrap `scanRepo` body to use coalesce:

```ts
export async function scanRepo(
  repoUrl: string,
  token?: string,
  octokit = getOctokit(token),
): Promise<Violation[]> {
  return coalesce(`scan:${repoUrl}`, () =>
    scanRepoInner(repoUrl, token, octokit),
  );
}
async function scanRepoInner(
  repoUrl: string,
  token?: string,
  octokit = getOctokit(token),
): Promise<Violation[]> {
  // ... existing body unchanged ...
}
```

- [ ] **Step 3: Verify tests**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/lib/scanner.test.ts src/lib/cache.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/scanner.ts src/lib/cache.ts
git commit -m "perf: batch 8, max 150 files, 10min cache, coalesce scans"
```

### Task D3: 3D offscreen pause + bundle budget

**Files:**

- Modify: `src/components/HeroScene.tsx`, `next.config.ts`

**Interfaces:**

- Consumes: none.
- Produces: paused R3F when offscreen; optimizePackageImports.

- [ ] **Step 1: Add IntersectionObserver pause to HeroScene**

In `HeroScene.tsx`, add:

```tsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import type { Group, Mesh } from "three";

function FloatingShape() {
  const mesh = useRef<Mesh>(null);
  const group = useRef<Group>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = document.getElementById("forge");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useFrame((state, delta) => {
    if (!active) return;
    if (group.current) group.current.rotation.y += delta * 0.15;
    if (mesh.current)
      mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
  });
  // ... rest unchanged ...
}
```

- [ ] **Step 2: Update next.config.ts**

Add `experimental: { optimizePackageImports: ["three", "@react-three/fiber", "@react-three/drei"] }` to the config object.

- [ ] **Step 3: Verify build**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm run build 2>&1 | tail -15`
Expected: build succeeds; 3D chunk split.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroScene.tsx next.config.ts
git commit -m "perf: pause 3D offscreen, optimize package imports"
```

---

## Workstream E — Testing

### Task E1: Coverage config + unit tests for new modules

**Files:**

- Modify: `vitest.config.ts`
- Create: `src/lib/errors.test.ts` (if not in A1), `src/lib/coalesce.test.ts` (if not in D1), extend `scanner.test.ts`

**Interfaces:**

- Consumes: all prior workstreams.
- Produces: 80% coverage gate.

- [ ] **Step 1: Update vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(root, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.ts",
        "src/app/api/**/*.ts",
        "src/components/**/*.tsx",
      ],
      exclude: ["src/lib/errors.ts", "**/*.test.ts", "**/*.d.ts"],
      thresholds: { lines: 80, functions: 75, branches: 70 },
    },
  },
});
```

- [ ] **Step 2: Add tests to reach 80%**

Add `src/lib/scanner.test.ts` cases for caps (150 files, batch 8) if missing. Add `src/lib/env.test.ts` for `validateEnv`.

- [ ] **Step 3: Run coverage**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run --coverage 2>&1 | tail -20`
Expected: lines ≥ 80%

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts src/lib/*.test.ts
git commit -m "test: coverage config + new module tests (80% gate)"
```

### Task E2: API integration tests

**Files:**

- Create: `src/app/api/scan.integration.test.ts`, `prioritize.integration.test.ts`, `pr.integration.test.ts`, `badge.integration.test.ts`

**Interfaces:**

- Consumes: routes (A3), AppError (A1).
- Produces: integration tests hitting route handlers via `fetch` + `NextRequest`.

- [ ] **Step 1: Write scan integration test**

```ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("/api/scan integration", () => {
  it("returns 400 for invalid URL", async () => {
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://gitlab.com/x/y" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errorId).toBeDefined();
  });
  it("returns 500 when GITHUB_TOKEN missing", async () => {
    const token = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    const req = new NextRequest("http://localhost/api/scan", {
      method: "POST",
      body: JSON.stringify({ repoUrl: "https://github.com/owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CONFIG_ERROR");
    process.env.GITHUB_TOKEN = token;
  });
});
```

- [ ] **Step 2: Add prioritize/pr/badge integration tests**

Mirror pattern: invalid payload → 400 + `errorId`; missing consent → 400.

- [ ] **Step 3: Run integration**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx vitest run src/app/api`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/*.integration.test.ts
git commit -m "test: API integration tests for all routes"
```

### Task E3: Playwright e2e

**Files:**

- Create: `e2e/scan-flow.spec.ts`, `e2e/error-states.spec.ts`, `e2e/reduced-motion.spec.ts`, `playwright.config.ts`
- Deps: `@playwright/test`

**Interfaces:**

- Consumes: full app (A-F).
- Produces: e2e suite.

- [ ] **Step 1: Install + config**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm install -D @playwright/test && npx playwright install --with-deps chromium`

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  webServer: { command: "npm run dev", port: 3000, reuseExistingServer: true },
  use: { baseURL: "http://localhost:3000" },
});
```

- [ ] **Step 2: Write scan-flow.spec.ts**

```ts
import { test, expect } from "@playwright/test";

test("paste repo shows results", async ({ page }) => {
  await page.goto("/");
  await page.fill(
    'textarea[aria-label="Paste HTML markup"]',
    "<img src=x.png>",
  );
  await page.getByRole("button", { name: /scan/i }).click();
  await expect(page.getByText(/fixes applied/i)).toBeVisible();
});
```

- [ ] **Step 3: Write error-states.spec.ts + reduced-motion.spec.ts**

error-states: fill invalid URL → expect error banner with `role="alert"`.
reduced-motion: `page.emulateMedia({ reducedMotion: "reduce" })` then verify no canvas (3D disabled).

- [ ] **Step 4: Run e2e**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx playwright test 2>&1 | tail -15`
Expected: all green (may skip if browser unavailable).

- [ ] **Step 5: Commit**

```bash
git add e2e/ playwright.config.ts package.json package-lock.json
git commit -m "test: Playwright e2e suite"
```

---

## Workstream F — Deploy Docs

### Task F1: Health route + DEPLOY.md + size-limit

**Files:**

- Create: `src/app/api/health/route.ts`, `DEPLOY.md`, `size-limit.json`
- Modify: `package.json` (scripts)

**Interfaces:**

- Consumes: `validateEnv` (C3).
- Produces: health endpoint, deploy runbook, bundle budget.

- [ ] **Step 1: Write health route**

```ts
import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export async function GET() {
  const tokenOk = !!process.env.GITHUB_TOKEN;
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    ready: tokenOk,
  });
}
```

- [ ] **Step 2: Write DEPLOY.md**

Document: prerequisites (SENTRY_DSN, GITHUB_TOKEN, OPENAI_API_KEY), `/api/health` probe, env validation at boot, Vercel instant rollback, secrets checklist (server-only), rate-limit in-memory caveat (Redis swap note).

- [ ] **Step 3: Add size-limit.json + script**

```json
{ "path": ["src/app/**/*.tsx", "src/components/**/*.tsx"], "limit": "200 KB" }
```

Add to package.json scripts: `"size": "size-limit"`, `"test:cov": "vitest run --coverage"`. Install `size-limit` + `@size-limit/preset-big-lib`.

- [ ] **Step 4: Verify**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && curl -s localhost:3000/api/health || echo "start dev to test"`
Expected: health JSON when running.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/health/route.ts DEPLOY.md size-limit.json package.json package-lock.json
git commit -m "docs: deploy runbook + health probe + bundle budget"
```
