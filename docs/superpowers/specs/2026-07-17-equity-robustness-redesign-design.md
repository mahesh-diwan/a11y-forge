# equity — Robustness Redesign Design Spec

**Date:** 2026-07-17
**Scope:** Full stack (API + frontend) robustness across 6 axes: error handling, observability, security, performance, testing, deploy safety.

## Decisions (locked)

- **Error model:** Typed error hierarchy in `lib/errors.ts`. Route edge wrapper `withErrorHandler`.
- **Observability:** Structured logs (extend `lib/logger.ts`) + Sentry (server + browser). No OTel vendor.
- **Security:** Env `GITHUB_TOKEN` kept. Hardening: CSP + security headers via `middleware.ts`, `RateLimiter` interface (in-memory now, Redis-ready), extended zod validation, scan caps.
- **Frontend obs:** Sentry browser SDK in `layout.tsx`; `ErrorBoundary` reports to Sentry; error toast via `Alert`.
- **Testing:** Unit (→80% coverage) + API integration tests + Playwright e2e. Coverage gate script.
- **Deploy:** Docs-only (`DEPLOY.md`) — health/readiness probe, env validation, rollback, secrets checklist.
- **Performance:** Aggressive — streaming scan responses, request coalescing, GitHub batch 5→8, 3D offscreen pause, bundle budget (code-split mermaid/pdf-lib/three).

## 1. Error Handling

### 1.1 Typed error hierarchy — `src/lib/errors.ts`

```
AppError (base)
  ├─ ValidationError   (400, code VALIDATION_ERROR)
  ├─ RateLimitError     (429, code RATE_LIMITED)
  ├─ GitHubError        (502, code GITHUB_ERROR)  — wraps Octokit failures
  ├─ OpenAIError        (502, code OPENAI_ERROR)  — wraps openai SDK failures
  ├─ ScanError          (500, code SCAN_FAILED)
  └─ ConfigError        (500, code CONFIG_ERROR)
```

Each carries:

- `code: string` — stable machine code
- `status: number` — HTTP status
- `safeMessage: string` — user-facing, no internals
- `details?: unknown` — internal context (NOT sent to client)
- `errorId: string` — generated, logged + returned in body for support correlation

Replace ad-hoc `apiError()` calls in routes with thrown `AppError` subclasses; keep `apiError()` as deprecated compat shim (one release) or delete + update callers. Decision: **delete + update callers** (cleaner, no tech debt).

### 1.2 Route edge wrapper — `src/lib/route-handler.ts`

```ts
export function withErrorHandler<T>(
  fn: (req: NextRequest) => Promise<NextResponse<T>>,
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const errorId = crypto.randomUUID();
    try {
      const res = await fn(req);
      logRequest(req.nextUrl.pathname, res.status, Date.now() - start, {
        errorId,
      });
      return res;
    } catch (err) {
      const appErr =
        err instanceof AppError
          ? err
          : new AppError("INTERNAL_ERROR", 500, "Unexpected error", {
              cause: err,
            });
      Sentry.captureException(err, {
        tags: { errorId, route: req.nextUrl.pathname },
      });
      logRequest(req.nextUrl.pathname, appErr.status, Date.now() - start, {
        errorId,
        code: appErr.code,
      });
      return NextResponse.json(
        { error: { code: appErr.code, message: appErr.safeMessage, errorId } },
        { status: appErr.status },
      );
    }
  };
}
```

All 6 routes wrap handler body in `withErrorHandler`.

## 2. Observability

### 2.1 Logger — `src/lib/logger.ts`

Extend to structured fields:

```ts
logRequest(route, status, ms, { errorId?, code?, meta? })
logError(errorId, err, { route?, meta? })
```

JSON to stdout (Vercel captures). Levels: info/warn/error.

### 2.2 Sentry — `src/lib/sentry.ts` + `src/instrumentation.ts`

- `instrumentation.ts` (Next 16): `register()` calls `Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate, environment })`.
- `lib/sentry.ts`: re-export configured client; `captureAppError(err, ctx)`.
- Browser: `Sentry.init` in `layout.tsx` (client). `ErrorBoundary` calls `Sentry.captureException`.
- Env: `SENTRY_DSN` optional; if absent, no-op (safe for local).

## 3. Security

### 3.1 Security headers — `src/lib/security-headers.ts` + `src/middleware.ts`

`middleware.ts` applies to all routes (except static):

- `Content-Security-Policy`: default-src 'self'; script-src 'self' 'unsafe-inline' (Next needs inline for RSC); img-src 'self' data: https:; connect-src 'self' api.openai.com api.github.com; frame-ancestors 'none'.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security` (prod only): `max-age=63072000; includeSubDomains`.

### 3.2 Rate limiting — `src/lib/rate-limit.ts` → `RateLimiter` interface

```ts
interface RateLimiter {
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetAfter: number;
  };
}
```

In-memory impl (current). Comment: swap for Redis/Upstash in prod. Middleware uses `RateLimiter` keyed by IP (or `x-forwarded-for`).

### 3.3 Input validation hardening

- Extend zod schemas in `validation.ts`: cap `violations` array length (e.g. 500), `group.violations` length, `repoUrl` max length.
- Sanitize: `parseGithubUrl` rejects non-github + non-http(s).
- Scan caps: `MAX_FILES = 150` (was 100), `BATCH_SIZE = 8` (was 5), `MAX_TREE_DEPTH` implicit via tree API.

### 3.4 Secrets

- Verify `.gitignore` excludes `.env*` (currently `.env.local` present — confirm ignored).
- Document: never log tokens; `GITHUB_TOKEN` server-only.

## 4. Performance (aggressive)

### 4.1 Streaming scan — `src/app/api/scan/route.ts`

Return `ReadableStream` of JSON chunks: `{ "type": "progress", ... }` then `{ "type": "result", ... }`. Client `runWorkflow` adapter reads stream. Fallback: non-streaming if client doesn't support.

Simpler alt (if stream complex): keep JSON but add `X-Scan-Progress` header + poll `/api/scan/status` — rejected (polling adds latency). Streaming chosen.

### 4.2 Request coalescing — `src/lib/coalesce.ts`

```ts
const inflight = new Map<string, Promise<ScanResult>>();
export function coalesce(key, fn) {
  /* dedupe concurrent identical scans */
}
```

Key = `repoUrl|sha`. Prevents N users scanning same repo → N GitHub API hits.

### 4.3 GitHub API tuning

- `BATCH_SIZE` 5→8 in `scanner.ts`.
- Cache TTL 5min→10min in `cache.ts`.
- Parallel tree fetch (already parallel per-file; add tree pagination if >1 page).

### 4.4 3D offscreen pause — `src/components/HeroScene.tsx`

Add IntersectionObserver: pause `useFrame` when `ForgeHero` offscreen. Already lazy + reduced-motion.

### 4.5 Bundle budget — `next.config.ts`

- `experimental: { optimizePackageImports: ["three", "@react-three/*"] }`
- Add `size-limit` config + `npm run size` script; code-split `mermaid` (dynamic import in `Mermaid.tsx`), `pdf-lib` (dynamic in report/pdf route).

## 5. Testing

### 5.1 Unit (→80%)

Add tests: `errors.test.ts`, `logger.test.ts`, `security-headers.test.ts`, `coalesce.test.ts`, `rate-limit.test.ts`, extend `cache.test.ts`, `scanner.test.ts` (caps).

### 5.2 API integration — `src/**/*.integration.test.ts`

Use `next-testing-library` or raw `fetch` against route handlers in vitest (node env). Cover: valid scan, invalid URL (400), rate-limit (429), missing token (500).

### 5.3 E2E — `e2e/` (Playwright)

- `scan-flow.spec.ts`: paste repo, watch terminal, see results.
- `error-states.spec.ts`: invalid URL → error banner; API down → boundary.
- `reduced-motion.spec.ts`: verify 3D disabled.

### 5.4 Coverage gate

`vitest run --coverage --coverage.thresholds.lines 80`. Script `npm run test:cov`.

## 6. Deploy Safety (docs)

### 6.1 `DEPLOY.md`

- **Health/readiness:** add `GET /api/health` → `{ status: "ok", ts, version }`. Readiness checks `GITHUB_TOKEN` present.
- **Env validation:** `src/lib/env.ts` validates required env at boot; fails fast with clear message.
- **Rollback:** Vercel instant rollback; document step.
- **Secrets checklist:** SENTRY_DSN, GITHUB_TOKEN, OPENAI_API_KEY all server-only; never in client bundle.
- **Rate-limit note:** in-memory resets on deploy; document Redis swap for prod.

## Files

**Create:**

- `src/lib/errors.ts`, `src/lib/route-handler.ts`, `src/lib/sentry.ts`, `src/instrumentation.ts`
- `src/lib/security-headers.ts`, `src/middleware.ts`, `src/lib/coalesce.ts`, `src/lib/env.ts`
- `src/app/api/health/route.ts`
- `src/lib/errors.test.ts`, `src/lib/logger.test.ts`, `src/lib/security-headers.test.ts`, `src/lib/coalesce.test.ts`, `src/lib/rate-limit.test.ts`
- `src/**/*.integration.test.ts` (scan, prioritize, pr, badge)
- `e2e/scan-flow.spec.ts`, `e2e/error-states.spec.ts`, `e2e/reduced-motion.spec.ts`
- `DEPLOY.md`, `size-limit.json`

**Modify:**

- `src/lib/logger.ts` (structured fields)
- `src/lib/rate-limit.ts` (interface)
- `src/lib/validation.ts` (caps)
- `src/lib/cache.ts` (TTL 10min)
- `src/lib/scanner.ts` (BATCH_SIZE 8, MAX_FILES 150)
- `src/app/api/scan/route.ts` (streaming + withErrorHandler)
- `src/app/api/{prioritize,pr,report,report/pdf,badge}/route.ts` (withErrorHandler + AppError)
- `src/components/HeroScene.tsx` (offscreen pause)
- `src/components/ErrorBoundary.tsx` (Sentry)
- `src/app/layout.tsx` (Sentry browser)
- `next.config.ts` (optimizePackageImports, size-limit)
- `package.json` (sentry deps, size-limit, test:cov script)
- `vitest.config.ts` (coverage, integration include)
- `.github/workflows/ci.yml` (optional — if repo git-enabled)

## Success Criteria

- 80% line coverage.
- All 6 routes return structured JSON with `errorId` on failure.
- Sentry captures server + client errors (when DSN set).
- CSP + security headers present on all responses.
- Scan streaming works; coalescing prevents duplicate GitHub hits.
- Playwright e2e green.
- `DEPLOY.md` complete; `/api/health` responds 200.
- Build passes; bundle under budget (size-limit script green).
