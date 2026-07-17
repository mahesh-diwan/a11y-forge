# DEPLOY.md — Deployment Runbook (Accessibility Forge)

## 1. Prerequisites (server-only secrets)

All secrets below are **server-only**. They must NEVER be exposed to the browser
bundle. Do not prefix them with `NEXT_PUBLIC_`. Next.js will inline any
`NEXT_PUBLIC_*` var into client code — if a secret carries that prefix, treat it
as compromised and rotate it.

| Env var          | Required | Used for                         | Where set                       |
| ---------------- | -------- | -------------------------------- | ------------------------------- |
| `GITHUB_TOKEN`   | yes      | GitHub API (scan, PR creation)   | Vercel Project → Settings → Env |
| `OPENAI_API_KEY` | yes      | AI fix generation (GPT-5.6)      | Vercel Project → Settings → Env |
| `SENTRY_DSN`     | optional | Error reporting (no-op if unset) | Vercel Project → Settings → Env |

Set them in **Production**, **Preview**, and **Development** environments as
needed. After adding/removing a var, redeploy to pick it up.

## 2. Boot-time env validation

`src/lib/env.ts` exports `validateEnv()`. It throws if `GITHUB_TOKEN` is
missing. Wire it into server startup (e.g. `instrumentation.ts` `register()` or
the first API call) so a misconfigured deploy fails fast instead of serving 500s
mid-request.

```ts
// src/instrumentation.ts (nodejs runtime)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv(); // throws "Missing required env: GITHUB_TOKEN" if absent
    await import("@/lib/sentry");
  }
}
```

If `validateEnv()` throws at boot, the deploy is broken — fix the env var in
Vercel and redeploy (see rollback below).

## 3. Health probe

`GET /api/health` returns JSON and responds **even if secrets are missing**
(health must not depend on boot). It reports readiness:

```json
{
  "status": "ok",
  "ts": "2026-07-17T00:00:00.000Z",
  "version": "0.1.0",
  "ready": true
}
```

- `ready: true` → `GITHUB_TOKEN` present; app can serve full functionality.
- `ready: false` → `GITHUB_TOKEN` absent; boot validation would fail.

Use it as the Vercel **Health Check** path (`/api/health`). Probe:

```bash
curl -s https://<your-domain>/api/health
```

A 200 with `"status":"ok"` means the instance is live. `ready:false` means the
deploy succeeded but is not fully configured.

## 4. Build & deploy

```bash
npm install
npm run build
npm start
```

Deploy via Git push to the connected Vercel repo (auto-deploy on main), or:

```bash
npx vercel deploy --prod
```

Local smoke test (requires dev server up):

```bash
npm run dev &
curl -s localhost:3000/api/health
```

## 5. Instant rollback (Vercel)

If a deploy is broken:

1. Open the project in the Vercel dashboard → **Deployments**.
2. Find the last known-good deployment.
3. Click **⋮ → Promote to Production** (instant, no rebuild) — or
   **Rollback** if offered.
4. Re-run `curl -s https://<domain>/api/health` to confirm `ready:true`.

CLI alternative:

```bash
npx vercel rollback <deployment-url-or-id> --prod
```

Rollback swaps traffic to the prior immutable build instantly; env vars are
picked from the target environment, so confirm secrets are still set.

## 6. Secrets checklist (pre-deploy)

- [ ] `GITHUB_TOKEN` set (Production + Preview).
- [ ] `OPENAI_API_KEY` set (Production + Preview).
- [ ] `SENTRY_DSN` set if error reporting wanted (optional).
- [ ] No secret uses `NEXT_PUBLIC_` prefix.
- [ ] `/api/health` returns 200 with `ready:true` post-deploy.
- [ ] `npm run build` succeeds in CI.
- [ ] `npm run size` (size-limit) passes bundle budget.
- [ ] `npm run test:cov` passes coverage gate.

## 7. Rate limiting — in-memory caveat

`src/lib/rate-limit.ts` ships `MemoryRateLimiter`, an in-process limiter.

- **Caveat:** state lives in a single server instance's memory. On Vercel,
  each serverless function instance has its own map, and **all counters reset on
  every deploy / instance recycle**. Limits are best-effort, not global.
- **Swap to Redis** when you need global, durable limits: implement the
  `RateLimiter` interface (`check(key): RateLimitResult`) backed by a Redis
  `INCR` + `EXPIRE` (or token-bucket) and construct it in `middleware.ts`
  instead of `new MemoryRateLimiter()`.

## 8. Bundle budget

`size-limit.json` enforces a 200 KB limit on app/component `.tsx` chunks:

```bash
npm run size   # runs size-limit
```

Fails CI/local if any matched chunk exceeds the budget.
