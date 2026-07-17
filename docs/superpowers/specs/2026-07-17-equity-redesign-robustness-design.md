# equity — Sprint 1 (Visual Redesign) + Sprint 2 (System Robustness) Spec

## Context

equity is a dark-themed, stateless Next.js 16 accessibility scanner. It scans a GitHub repo for WCAG violations and opens PRs with fixes. Current state: dark-only theme, live terminal hero, double-bezel component system, rate-limit + consent + validation already in API, 54 passing tests. No DB, no auth, no CI, no 3D.

## Decisions (locked)

- **Theme:** Dark-only kept. No light theme. (Reverses earlier "deferred" — decision: stay dark, it is the brand.)
- **3D hero:** Keep live terminal; add R3F ambient 3D backdrop behind it. Lazy-loaded, `prefers-reduced-motion` disables 3D.
- **No DB / auth / CI.** Sprint 2 reframed to: GitHub API caching, rate-limit hardening, structured logging, error boundaries, performance, zod validation.
- **Data layer + API contracts unchanged.**

## Sprint 1 — Visual Redesign

### S1.1 3D hero backdrop (R3F + React Spring)

- Deps: `three`, `@react-three/fiber`, `@react-three/drei`. Motion via `react-spring` (or `@react-spring/three`).
- `HeroScene.tsx`: canvas with floating mesh (icosahedron / torus knot) in amber, slow auto-rotate, pointer-parallax. Positioned absolute behind `ForgeHero`.
- `next/dynamic` import with `ssr: false`. Fallback = static gradient (current body bg).
- Reduced motion: render null canvas, keep static.

### S1.2 Navigation

- No theme toggle (dark only). Nav pill stays. Optional: subtle entrance animation on load.

### S1.3 Core pages

- Guide / Docs / Dashboard: verify amber contrast on dark; add micro-reveal polish if needed.

### S1.4 Component library

- Document existing components (Button, Alert, Skeleton, bezel, Stepper, Tabs) — already in DESIGN.md. Add `HeroScene` + `ErrorBoundary` (Sprint 2) entries.
- Extend `Button`/`Tabs` with any missing states.

## Sprint 2 — System Robustness (reframed)

### S2.1 Error boundaries

- `ErrorBoundary.tsx` class component wrapping `<main>`; per-section boundary around Dashboard. Friendly fallback UI.

### S2.2 Input validation (zod)

- Add `zod`. Validate scan/prioritize/pr request bodies against schemas in `lib/validation.ts`. Replace ad-hoc guards where useful; keep `guardAndParse` but add schema check.

### S2.3 Rate limiting (production-ready)

- Keep in-memory `rate-limit.ts` but document serverless limit. Add `Retry-After` (done). Optionally support `MemoryStore` interface for future KV swap.

### S2.4 Caching

- `lib/cache.ts`: in-memory `Map` cache for GitHub file fetches keyed by `owner/repo/sha/path`, TTL 5 min. Wrap `fetchFile` in `github.ts`. Cache scan results by repo+default-branch sha.

### S2.5 Logging

- `lib/logger.ts`: structured request log (route, status, ms). Call in each API route via wrapper or middleware.

### S2.6 Performance

- 3D lazy-load (S1). Font `display:swap` (next/font). Bundle check post-3D.

## Global Constraints

- Keep `scanRepo` / `runWorkflow` / API response shapes unchanged.
- WCAG AA minimum (contrast, focus, reduced-motion).
- No DB, no auth, no CI.
- Dark-only.
- 54 tests stay green; add coverage toward >80%.
- Tailwind v4 tokens in `globals.css`.
- Custom motion `cubic-bezier(0.32,0.72,0,1)`, 250ms.
- Banned fonts (Inter/Roboto/etc) not used; Syne/DM Sans/JetBrains Mono stay.
