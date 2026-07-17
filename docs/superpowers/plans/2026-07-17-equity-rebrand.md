# Equity Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand `accessibility-forge` → `equity` across UI text, color tokens, and nav.

**Architecture:** Pure find/replace + tonal adjustment across ~8 files. No new components, no structural changes, no feature additions. Color token swap, nav text rename, voice alignment.

**Tech Stack:** Next.js 16, TS, Tailwind v4, CSS custom properties.

## Global Constraints

- All color token values taken from spec (see `docs/superpowers/specs/2026-07-17-equity-rebrand-design.md`)
- Keep all `--color-ink`, `--color-surface`, `--color-border`, `--color-text`, `--color-muted`, `--color-focus` unchanged
- Do not rename component files or CSS classes
- After changes: `npm run build` must pass, `npx vitest run` must pass 54/54
- Verify no remaining "forge" strings in UI-rendered text (case-insensitive grep on all `.tsx`)

---

### Task 1: Color Token Swap in globals.css

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Replace color token values**

| Old                                       | New                                      |
| ----------------------------------------- | ---------------------------------------- |
| `--color-pass: #e8a838`                   | `--color-pass: #58a6ff`                  |
| `--color-pass-bg: rgba(232,168,56,0.12)`  | `--color-pass-bg: rgba(88,166,255,0.12)` |
| `--color-warn: #f5b544`                   | `--color-warn: #d29922`                  |
| `--color-fail: #d4777a`                   | `--color-fail: #f85149`                  |
| `--color-fail-bg: rgba(212,119,122,0.08)` | `--color-fail-bg: rgba(248,81,73,0.08)`  |

Run: `grep '--color-pass\|--color-warn\|--color-fail' src/app/globals.css` to verify new values.

---

### Task 2: Nav Bar Text + Brand Mark

**Files:**

- Modify: `src/components/Nav.tsx`

- [ ] **Replace brand mark**: `~ forge` → `eq`
- [ ] **Replace nav items**: Forge → Scan, Dashboard → Results, Docs → API
- [ ] **Replace nav aria-labels**: update any aria-labels referencing old nav names
- [ ] **Replace mobile nav items**: same replacements

---

### Task 3: page.tsx Hero, Footer, Eyebrows

**Files:**

- Modify: `src/app/page.tsx`

- [ ] **Replace hero eyebrow** `make your website accessible to everyone` → `automated accessibility. from commit to pr.`
- [ ] **Replace footer** `accessibility-forge // wcag 2.1 scanner & fixer` → `equity // automated a11y from commit to pr`
- [ ] **Replace any remaining "forge" references in rendered text** (hero section, help text, etc.)

---

### Task 4: ForgeHero Terminal Title

**Files:**

- Modify: `src/components/ForgeHero.tsx`

- [ ] **Replace terminal window title** `accessibility-forge` → `equity scan`
- [ ] **Replace any UI text references to "forge" or "accessibility-forge"**

---

### Task 5: Voice Alignment in Supporting Components

**Files:**

- Modify: `src/components/HowItWorksSection.tsx`
- Modify: `src/components/DocsPage.tsx`
- Modify: `src/components/ScanForm.tsx`
- Modify: `src/components/Dashboard.tsx`

- [ ] **ScanForm.tsx**: Replace aria-label/help text referencing "forge" → "equity". Check placeholder text, labels, descriptions.
- [ ] **HowItWorksSection.tsx**: Replace any "forge" references in step labels or description text.
- [ ] **DocsPage.tsx**: Replace any "forge" references in section labels or description text.
- [ ] **Dashboard.tsx**: Replace any "forge" references in empty state text, labels, or hints.

---

### Task 6: Verify

- [ ] **Run grep** `rg -n 'forge' src/ --include='*.tsx' --include='*.css'` to find any remaining forge references
- [ ] **Run build** `npm run build` — expect ✓ Compiled
- [ ] **Run tests** `npx vitest run` — expect 54/54 pass
