# Equity — Rebrand Design

## Purpose

Rebrand `accessibility-forge` (craft-metaphor, vibe-coded) → `equity` (rigorous developer infrastructure for automated accessibility).

## Audience

Open-source maintainers, engineering teams (CI pipeline), accessibility specialists (deep reports). All three use same tool; nav/voice serves all without favoring one.

## Brand Identity

- **Name**: `equity` — single word, CLI-style capitalization, command-like
- **Tagline**: `automated accessibility. from commit to pr.`
- **Voice**: Matter-of-fact, never apologetic. Reports facts. Empty states invite action.
- **Visual shift**: warm craft (amber/forge) → cool infrastructure (blue/trust). Terminal motifs stay but cleaned up.

## Color Palette (Option 2 — Cool Blue)

- `--color-ink: #1a1717` (unchanged)
- `--color-surface: rgba(255,245,235,0.03)` (unchanged)
- `--color-surface-solid: #1e1919` (unchanged)
- `--color-border: rgba(255,245,235,0.06)` (unchanged)
- `--color-text: #cfcecd` (unchanged)
- `--color-muted: #9a9897` (unchanged)
- `--color-pass: #58a6ff` (was `#e8a838` amber)
- `--color-pass-bg: rgba(88,166,255,0.12)` (was amber)
- `--color-warn: #d29922` (was `#f5b544`)
- `--color-fail: #f85149` (was `#d4777a`)
- `--color-fail-bg: rgba(248,81,73,0.08)` (was old fail)
- `--color-focus: #8aa4d6` (unchanged)
- Typography (unchanged)
- Transition tokens (unchanged)
- Shadow tokens (unchanged)

## Navigation

| Old       | New     | Reason                            |
| --------- | ------- | --------------------------------- |
| `~ forge` | `eq`    | brand mark, short like `gh`/`npm` |
| Forge     | Scan    | action, not metaphor              |
| Dashboard | Results | what user sees                    |
| Guide     | Guide   | clear, keep                       |
| Docs      | API     | developers → API                  |

Nav pulse dot changs color to new `--color-pass` blue.

## Files to Change

### `globals.css`

- Replace `#e8a838` → `#58a6ff` (and all pass/pass-bg token values)
- Replace `#f5b544` → `#d29922` (warn token)
- Replace `#d4777a` → `#f85149` (fail token)
- Replace `#d4777a` → `#f85149` (fail-bg token)

### `Nav.tsx`

- `~ forge` → `eq`
- Nav items: Forge → Scan, Dashboard → Results, Docs → API
- Pulse dot color inherits from `--color-pass` (no hardcoded change needed if token updates)

### `page.tsx`

- Hero subtitle tagline replaced
- Eyebrow label `make your website accessible to everyone` → `automated accessibility. from commit to pr.`
- Footer: `accessibility-forge // wcag 2.1 scanner & fixer` → `equity // automated a11y from commit to pr`

### `ForgeHero.tsx`

- Terminal window title `accessibility-forge` → `equity scan`
- File rename not required (component name stays `ForgeHero` for minimal diff)

### `HowItWorksSection.tsx`

- Align step labels and voice to new brand
- No structural changes

### `DocsPage.tsx`

- Section eyebrow labels aligned to new name (`# documentation` stays — it's docs)
- No structural changes

### `ScanForm.tsx`

- Aria labels, help text updated to reference "equity" instead of "forge"
- No structural changes

## What Stays

- Double-bezel card system
- Dark theme
- Transition curves, spacing, layout grid
- All state/phase components (stepper, skeleton, activity log, empty state, confirm dialog)
- Keyboard shortcuts
- All API route implementations

## Scope Boundary

Rebrand only. No feature changes. No new components. No structural refactor. Pure find/replace + tonal adjustment across ~8 files.

## Verification

- `npm run build` — compiled successfully
- `npx vitest run` — 54/54 tests pass
- Manual: check no remaining "forge" strings in UI (case-insensitive)
