# accessibility-forge — Design System

## Overview

accessibility-forge is a dark, terminal-native instrument for automated WCAG fixing. The terminal IS the hero — a crafted instrument, not a dev-tool dark mode. Identity: warm-spectrum single amber accent on deep warm black, precise and editorial. No purple, no violet.

## Theme

- **Mode**: Dark only.
- **Scene**: A craftsperson at a terminal — the interface is the tool, not a wrapper around it. Terminal dominates; chrome recedes.
- **Color strategy**: One electric amber accent (`--color-pass`) at ~8% surface coverage. Everything else is warm-tinted neutrals driven from `--color-ink`. No secondary hue.

## Color Palette

```
--color-ink: #0a0908           (deep warm black, not charcoal)
--color-surface: rgba(255,244,230,0.025)  (warm-tinted glass)
--color-surface-solid: #161310  (solid warm surface)
--color-border: rgba(255,244,230,0.08)    (hairlines)
--color-text: #ece7e0          (warm off-white)
--color-muted: #a39c92         (warm mid-gray)
--color-pass: #ffb700          (electric amber — PRIMARY accent)
--color-pass-bg: rgba(255,183,0,0.1)
--color-warn: #ffb700          (amber — same family)
--color-fail: #ff5c5c          (coral red)
--color-fail-bg: rgba(255,92,92,0.08)
--color-focus: #ffb700         (amber — focus rings only)
```

## Typography

| Role    | Font                      | Usage                                         |
| ------- | ------------------------- | --------------------------------------------- |
| Display | Syne (700)                | Headings h1–h3, terminal title                |
| Body    | DM Sans (400, 600)        | Paragraphs, labels, card text                 |
| Mono    | JetBrains Mono (400, 600) | Code, nav items, metadata, badges, form input |

Scale: `clamp()` where practical. Heading ceiling ≤ 4rem.

## Spacing

Section padding: `py-24` to `py-32`. Hero `pb-24 pt-16`. Card padding: `p-4` to `p-6`. Grid gaps: `gap-4` baseline. Macro-whitespace generous — layout breathes.

## Motion

Transition curve: `cubic-bezier(0.32, 0.72, 0, 1)`. Duration `250ms` for UI, `800ms` scroll reveals with blur fade. Reduced motion respected via `@media (prefers-reduced-motion: reduce)`.

### Haptic feedback

- Buttons: `active:scale-[0.97]` press-down. Trailing icon circle `group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110`, `group-active:scale-95`.
- Nav links (bottom bar): active state subtle amber bg (`--color-pass-bg`), no underline.

### Scroll reveal

`translate-y-16 blur-md opacity-0` → `translate-y-0 blur-0 opacity-100` over 800ms via IntersectionObserver at 15% threshold. One-shot.

## Texture

Film grain noise overlay via fixed `body::after`. SVG `feTurbulence` (fractalNoise, baseFrequency 0.9, 4 octaves). Opacity 0.025. `pointer-events: none`, `z-index: 50`.

## Shadows

Multi-layer ambient shadows, rgba(0,0,0,0.15–0.3). No harsh single-layer black drops.

```
--shadow-sm: 0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)
--shadow-md: 0 4px 14px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12)
--shadow-lg: 0 10px 40px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.15)
```

## Layout

### Nav

Bottom-anchored contextual bar (fixed, full-width-ish, solid surface + border, no glass). Nav items shift by route context. Active item amber bg. Mobile: same bar, condensed.

### Hero

Terminal-dominant full-width. The live forge terminal is the hero — large, centered, full-bleed. Heading + description sit above; form is inline within or below terminal, never side-by-side split.

### Sections

- How it works: single bezel card, stepped content
- Dashboard: bento grid — score card spans 2 cols, violation cards uniform, PR list 2-column
- Docs: technical reference, bezel cards, mermaid diagrams, API routes

### Cards

Double-bezel architecture: outer shell (border + surface tint, `rounded-[1.25rem]`, padding 0.5rem) + inner core (solid bg, `rounded-[calc(1.25rem-0.5rem)]`, inset shadow). Sizes vary by importance.

## Components

| Component       | Role                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Nav`           | Bottom contextual bar, brand, route-aware items, mobile condensed                                                           |
| `ForgeHero`     | Terminal-dominant hero — paste HTML, see real fixes applied                                                                 |
| `HeroScene`     | R3F ambient 3D backdrop behind ForgeHero, lazy, reduced-motion safe                                                         |
| `ScoreCard`     | Grade circle, breakdown bars, download report/badge                                                                         |
| `ViolationCard` | Severity badge, file:line, snippet, confidence                                                                              |
| `Stepper`       | Scan → Prioritize → Fix & PR phase indicators                                                                               |
| `PRCard`        | PR link, fix count, diffs preview                                                                                           |
| `Tabs`          | Violations / Screen Reader / Before-After with ARIA                                                                         |
| `Button`        | Pill buttons, primary (amber), secondary (border), ghost, danger. Trailing icon in circular wrapper, `active:scale-[0.97]`. |
| `Alert`         | Tone-based (error/warning/success/info), role="alert"                                                                       |
| `Skeleton`      | Pulse animation for loading states                                                                                          |
| `EmptyState`    | Dashed border placeholder, muted text, invite action                                                                        |
| `ScanForm`      | URL input with repo validation, phase-aware submit/cancel                                                                   |
| `ConfirmDialog` | Pre-scan confirmation with dry-run toggle, role="dialog"                                                                    |
| `ActivityLog`   | Timestamped log with `aria-live="polite"`                                                                                   |
| `ErrorBanner`   | Error alert with message                                                                                                    |
| `states`        | Barrel — EmptyState + ErrorBanner + ActivityLog + ScanSkeleton                                                              |

## Anti-patterns eliminated

- No violet / purple anywhere (single amber accent only)
- No Space Grotesk or Plus Jakarta Sans (Syne + DM Sans only)
- No top floating nav pill (bottom contextual bar instead)
- No side-by-side form + terminal split (terminal-dominant hero)
- No glass effects (solid surface everywhere)
- No eyebrow labels
- No pulse/animated dots
- No gradient text
- No `ease-in-out` transitions
- No harsh single-layer black drop shadows
- No single-layer borders (all cards double-bezel)
- No naked trailing icons in buttons
