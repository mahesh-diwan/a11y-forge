---
scoreA_total: 29
scoreB_total: 15
p1_count: 2
p2_count: 3
p3_count: 3
timestamp: 2026-07-16T14-54-36Z
slug: src-app-page-tsx
---
# Critique: Accessibility Forge — src/app/page.tsx

**Date**: 2026-07-16
**Method**: Source review (A) + Browser detector + static analysis (B)

---

## Consolidated Score

| Dimension | A | B | Composite |
|-----------|---|---|-----------|
| Score     | 29/40 | 15/20 | 44/60 |

---

## P1 — Must Fix

1. **Muted contrast fails WCAG AA** — `#656363` on `#1a1717` ~3.2:1 (needs 4.5:1). Affects 10-13px labels, metadata, file paths across Nav, ViolationCard, ScoreCard, ForgeHero, PRCard, Stepper, states, page.tsx. Confirmed by A + B.
   - Fix: lighten muted to ~#9a9897 or darken bg/use larger size.

2. **Hidden focusable elements in Nav overlay** — mobile nav uses `opacity: 0` + `pointer-events: none` but links remain tabbable. Keyboard users hit 3 invisible elements before main content.
   - Fix: add `visibility: hidden` or `inert` when `!open`.

---

## P2 — Should Fix

3. **No skip-to-content link** — no way to bypass nav with keyboard.
   - Fix: add skip link at top of `layout.tsx`.

4. **Thin focus indicator** — 1px outline, ~0.8px rendered. Below recommended 2px.
   - Fix: increase to 2px.

5. **No active/pressed state on buttons** — cursor change only on hover, no visual press feedback.
   - Fix: add `active:` transform or darker bg.

---

## P3 — Nice to Fix

6. **`aria-modal` present when closed** — `aria-modal={open}` evaluates to `"false"` when closed. ARIA spec says only present when modal active.
   - Fix: conditional render `aria-modal`.

7. **No help/documentation on page** — no tooltips, help text, or docs link.
   - Fix: add minimal help section or tooltip.

8. **Touch targets borderline** — buttons ~36px vs recommended 44px minimum.
   - Fix: increase to min-h-11.

---

## What's Working Well

- No AI slop — distinctive warm terminal aesthetic
- Cohesive palette, consistent grid system, disciplined spacing
- Good responsive behavior, graceful mobile stacking
- Scroll-reveal animations respect `prefers-reduced-motion`
- Global focus-visible ring, good keyboard tab order (aside from overlay)
- No console errors, clean build
