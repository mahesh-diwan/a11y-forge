# accessibility-forge — Design System (Catalog Grid)

## Overview

Catalog-grid aesthetic: tight, single-layer cards on charcoal canvas with amber accent. No 3D, no film grain, no double-bezel. Mini hero, filter bar, 2-column violation grid.

## Palette

```
--color-canvas: #121212       (charcoal bg)
--color-surface: #1e1e1e      (card surface)
--color-surface-hover: #262626(hover)
--color-border: rgba(255,255,255,0.06)
--color-text: #e8e8e8         (off-white)
--color-muted: #888           (mid-gray)
--color-pass: #ffb700         (amber accent)
--color-pass-bg: rgba(255,183,0,0.12)
--color-fail: #ff5c5c         (coral)
--color-fail-bg: rgba(255,92,92,0.1)
--color-focus: #ffb700        (focus rings)
```

## Typography

| Role    | Font                   | Usage                              |
| ------- | ---------------------- | ---------------------------------- |
| Display | Syne 700               | Headings h1-h3                     |
| Body    | DM Sans 400,600        | Paragraphs, labels                 |
| Mono    | JetBrains Mono 400,600 | Code, nav, metadata, badges, input |

## Shadows

```
--shadow-card: 0 1px 4px rgba(0,0,0,0.3)
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.4)
```

## Motion

Transition: `250ms` ease-premium. Scroll reveal: `800ms` translateY+blur fade. Reduced motion respected.

## Components

- **Nav** — floating pill, fixed top-center. Logo, links, mobile hamburger.
- **Card** — shared wrapper (`rounded-lg border p-4`, hover shadow on enter/leave).
- **FilterBar** — horizontal scrollable `role="tablist"` tag row. Full/solid variants.
- **ForgeHero** — mini (~200px). Condensed terminal textarea + fix count. No 3D. No dynamic imports.
- **ScanForm** — compact inline (flex row, input + amber button). Phase-aware Scan/Cancel.
- **Stepper** — mini inline (arrow-separated, `font-mono text-[10px]`).
- **Dashboard** — ScoreCard full-width at top. ViolationCard 2-col grid. Screen reader / PR sections.
- **ViolationCard** — severity dot + `file:line` mono + title + snippet. Single `Card` wrapper.
- **ScoreCard** — grade circle + score + download buttons. Full-width, no hover.
- **PRCard** — PR number link, fix count, category. Single `Card` wrapper.
- **Tabs** — violations / screen reader / diff with ARIA. Amber underline active.
- **ConfirmDialog** — modal with dry-run toggle, AI consent checkbox. Amber theme.
- **states** — barrel: EmptyState, ErrorBanner, ActivityLog, ScanSkeleton.

## Anti-patterns removed

- No 3D (no R3F, no `@react-three/fiber`, no `@react-spring/three`)
- No film grain (`body::after` with `feTurbulence`)
- No mesh orbs / gradient blobs
- No double-bezel cards (outer + inner concentric radii)
- No bento grid (ScoreCard spans full width, violations 2-col uniform)
- No `--color-surface-solid` (use `--color-surface` everywhere)
- No `--color-amber` (use `--color-pass`)
