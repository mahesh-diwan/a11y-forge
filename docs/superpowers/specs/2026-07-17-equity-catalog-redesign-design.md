# equity — Catalog Grid Redesign (inspired by getdesign.md)

## Overview

Restyle equity scanner UI to match getdesign.md's catalog-grid visual language: dark editorial canvas, 2-col card grid, filter bar, badges, mini hero. Keep amber accent, scan/PR workflow, all functionality unchanged.

## Decisions

- **Approach:** A — Catalog Grid. Results as scannable card grid. Filter bar top. Mini hero condensed.
- **Palette:** Hybrid tone. Amber `#ffb700` accent on `#121212` charcoal canvas. Deepest surfaces `#0a0908` ink. Catalog cards `#1e1e1e` surface. `--color-muted` `#888`. No emerald.
- **Grid:** 2-col tight cards (`p-4`, title + severity dot + snippet). Responsive: 1-col mobile, 2-col tablet+, 3-col wide desktop (optional).
- **Nav:** Floating pill (current, unchanged).
- **Hero:** Mini hero. Condensed terminal + input in top section (~200px). No 3D backdrop. H1 above in Syne (1 line). Grid starts below fold.
- **Cards:** Tight density. Severity dot (coral pass amber). File:line mono label. Snippet text. Hover: subtle surface lift.
- **Filter bar:** Horizontal scrollable tag row above grid. Categories: all / missing-alt-text / aria-label / contrast / keyboard / headings / links. Active tag = `--color-pass-bg`.
- **Dashboard:** Catalog grid replaces current bento layout. Score card = prominent card at grid top (full width or 2-col). Violation cards = grid. PR list = secondary section.

## Color Palette

```
--color-ink: #0a0908           (deep ink)
--color-canvas: #121212         (main bg, charcoal)
--color-surface: #1e1e1e        (card bg)
--color-surface-hover: #262626  (card hover)
--color-border: rgba(255,255,255,0.06)
--color-text: #e8e8e8
--color-muted: #888
--color-pass: #ffb700           (amber accent)
--color-pass-bg: rgba(255,183,0,0.12)
--color-fail: #ff5c5c           (coral)
--color-fail-bg: rgba(255,92,92,0.1)
--color-focus: #ffb700
```

## Typography

- Display: Syne 700 (headings)
- Body: DM Sans 400/600 (paragraphs, labels)
- Mono: JetBrains Mono 400/600 (file:line, tags, code)
- Scale: `clamp()` heading ceiling 3rem. Body 14px grid.

## Page Layout

```
┌──────────────────────────────────────┐
│  [f lo a t i n g  p i l l  n a v]   │  top-6
├──────────────────────────────────────┤
│  H1  "Paste a repo. equity ..."     │  mini hero
│  [scan input + submit]  [stepper]    │  ~200px
├──────────────────────────────────────┤
│  [filter tag row]                    │  horizontal scroll
├──────────────────────────────────────┤
│  ┌──────┐ ┌──────┐                   │  2-col tight grid
│  │ card │ │ card │                   │
│  ├──────┤ ├──────┤                   │
│  │ card │ │ card │                   │
│  └──────┘ └──────┘                   │
└──────────────────────────────────────┘
```

## Components (restyled)

| Component       | Current → New                                                           |
| --------------- | ----------------------------------------------------------------------- |
| `Nav`           | Keep pill. Color tokens update.                                         |
| `ForgeHero`     | → Mini hero. No 3D. Terminal condensed. Text input prominent.           |
| `ScanForm`      | Compact inline. Left search icon, right amber submit pill.              |
| `Dashboard`     | → Catalog grid. Filter bar + 2-col cards.                               |
| `ViolationCard` | → Tight card: severity dot, file:line mono, title, snippet. Hover lift. |
| `ScoreCard`     | Full-width card atop grid. Grade circle reduced.                        |
| `PRCard`        | Keep, restyle to match card system.                                     |
| `Stepper`       | Inline mini phase bar next to scan button.                              |
| `FilterBar`     | New. Horizontal scrollable tag row. `role="tablist"`.                   |
| `Tabs`          | Keep (Reader / Before-After tabs below card click). Restyle.            |
| `VerdictBanner` | Keep, amber variant.                                                    |
| `ConfirmDialog` | Keep, restyle.                                                          |
| `ActivityLog`   | Collapsible bottom section.                                             |

## Anti-patterns (removed)

- No 3D backdrop (mini hero)
- No bento grid dashboard (catalog grid)
- No double-bezel (single-layer cards)
- No `opacity-40` overlays
- No film grain noise
- No mesh ambient orbs
- No scroll reveal blur (fade only)
- No multi-layer shadows (single tight shadow)

## Files to change

**Modify:**

- `src/app/globals.css` — new color tokens, card styles, filter bar
- `src/components/Nav.tsx` — color tokens
- `src/components/ForgeHero.tsx` — mini hero, no 3D
- `src/components/ScanForm.tsx` — compact inline
- `src/components/Dashboard.tsx` — catalog grid layout
- `src/components/ViolationCard.tsx` — tight card
- `src/components/ScoreCard.tsx` — reduced, full-width
- `src/components/PRCard.tsx` — restyle
- `src/components/Stepper.tsx` — mini inline
- `src/components/ConfirmDialog.tsx` — restyle
- `src/components/Tabs.tsx` — restyle
- `src/app/page.tsx` — layout restructure (mini hero, filter bar, grid)
- `DESIGN.md` — rewrite

**Create:**

- `src/components/FilterBar.tsx`
- `src/components/Card.tsx` (shared card wrapper)

**Delete:**

- `src/components/HeroScene.tsx` (3D no longer used)
- `src/lib/coalesce.ts` (unused in redesign — keep for robustness, just no UI dep)

## Implementation order

1. Globals.css tokens + base styles
2. Shared Card component
3. Mini ForgeHero (no 3D)
4. ScanForm compact
5. FilterBar
6. Dashboard → catalog grid
7. ViolationCard tight
8. ScoreCard reduced
9. PRCard restyled
10. Stepper mini
11. page.tsx layout restructure
12. Nav/ConfirmDialog/Tabs restyle
13. DESIGN.md rewrite
14. Verify + build
