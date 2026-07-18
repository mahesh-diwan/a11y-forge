# a11y-forge — Hackathon-Ready Redesign

## Meta

- **Project**: a11y-forge (formerly accessibility-forge)
- **Event**: OpenAI Build Week (deadline Jul 21 @ 5PM PT)
- **Track**: Developer Tools
- **Stack**: Next 16, TypeScript 5, Tailwind v4, Octokit, OpenAI SDK, Zod 4
- **Status**: Existing backend (6 API routes, 8 scanner modules, 121 tests, 92% coverage) + frontend rewrite

## Purpose

Autonomous a11y fixer. Paste GitHub repo URL → scan for WCAG 2.2 violations → group by type → generate AI fixes → create pull requests. No config, no a11y expertise required.

## Brand

- **Name**: a11y-forge
- **Tagline**: "Autonomous accessibility fixes for your repos"
- **Mark**: `af` in monospace
- **Voice**: Direct, developer-first, no marketing fluff
- **Why this name**: "a11y" is the standard numeronym for accessibility — instantly recognized by dev audience. "Forge" implies shaping/creating fixes, not just detecting them. Combined, it communicates both domain (a11y) and action (forge) in one compound word. No decoding needed.

## Design Philosophy

**Dual-mode delivery**:

| Surface | Approach | Rationale |
|---------|----------|-----------|
| App UI | Brutalist | Raw, sharp corners, flat, high contrast, system fonts, no motion. Respects reduced-motion as default. Communicates developer-tool honesty. |
| Documentation | Rich + diagrammed | Mermaid flowcharts, pipeline diagrams, sequence diagrams. Docs must explain complex workflow clearly — visual aids serve understanding. |

## Palette

```css
--canvas: #000000        /* pure black bg */
--surface: #1a1a1a       /* card bg */
--text: #ffffff           /* primary text */
--muted: #666             /* secondary text */
--accent: #ffb700         /* amber — single color pop */
--fail: #ff3b3b           /* violation red */
--border: #333            /* visible borders */
```

## Typography

| Role | Font | Weight |
|------|------|--------|
| Display | Arial Black / Helvetica Now Display | 800 |
| Body | Inter / system-ui | 400, 600 |
| Mono | JetBrains Mono / SF Mono | 400, 600 |

System fallback stack ensures instant load. No variable fonts.

## Page Structure (Single-Page App)

### Nav
Floating pill, fixed top, dark surface bg, amber `af` mark. Links: Scan, Results, Guide, Docs. Version badge `eq 0.1.0` right side.

### Section 1: Hero
Above fold. h1 "a11y-forge" + subtitle. URL input + Scan button inline. "Try demo repo" link for one-click demo without GitHub token. Static stats line. Footnote explaining scope.

### Section 2: How It Works
4-step pipeline (Scan → Group → Fix → PR) in 2x2 grid. Sharp-bordered boxes. No animations. No mermaid here — pure text. Footnote: "4-step pipeline. ~2 min per repo."

### Section 3: Results
Appears after scan completes, inline. ScoreCard (grade circle, numeric score, download buttons). Tab bar (Issues / Screen Reader / Diff/PR). ViolationCard 2-col grid. PRCard 2-col grid.

### Section 4: Technical Docs
API reference (6 routes) as flat list. Scanner modules table. Setup instructions with env vars. Mermaid diagrams (pipeline flowchart + sequence diagram + state machine). Rate limit notes.

### Section 5: Footer
Brand mark, tagline, "built with Codex + GPT-5.6", GitHub link, version.

## Component Spec

### ScanForm
- Input + button inline flex
- Button label: "Scan" → "Scanning…" → "Prioritizing…" → "Fixing…" → "Done"
- Error state: red text below input
- No stepper component — phase text + file counter only
- `1px #333` input border, amber button bg `#ffb700` black text

### ScoreCard
- Outline circle (2px `#ff3b3b` or `#ffb700`), grade letter inside
- Numeric score right side
- 3 download buttons: HTML Report, PDF Report, Badge SVG
- No shadow, no hover, flat

### ViolationCard
- Raw div, `1px #333` border
- Severity dot (filled circle `#ff3b3b` or `#ffb700`)
- `file:line` in mono amber
- Description in body text
- Code snippet box with mono text
- 2-col grid in results section

### PRCard
- Raw div, `1px #333` border
- PR number link in amber
- Fix count + category mono
- "View PR →" link

### Tabs
- Mono labels
- Amber underline for active tab only
- No bg highlight, no rounded indicators

### Demo Mode
- "Try demo repo" link below scan input
- Seeds `github.com/mahesh-diwan/a11y-forge-demo` as fake repo
- Triggers mock scan with seeded data
- Lets judges see full flow without GitHub token
- Essential for hackathon — token setup kills demo flow

## State Machine

```
idle → scanning → prioritizing → fixing → done
  ↓        ↓           ↓            ↓
error ←───┴───────────┴────────────┘ → idle (reset)
```

States map to phase text in ScanForm button. No stepper component.

## Diagrams (in Docs section)

Three Mermaid diagrams in Technical Docs:

1. **Pipeline flowchart**: Submit URL → Scan sources → Prioritize → Generate fixes → Create PRs
2. **Sequence diagram**: Client → POST /api/scan → POST /api/prioritize → POST /api/pr → GitHub API → OpenAI API
3. **State machine**: Visual state transitions (same as above)

## Deployment

- **Platform**: Vercel (native Next.js support, zero config, free tier)
- **Alternative**: Coolify (self-hosted, more control)
- **Not suitable**: GitHub Pages (no API route support)
- **Env vars**: GITHUB_TOKEN, OPENAI_API_KEY, SENTRY_DSN (optional)
- **Health check**: GET /api/health

## Key Files to Create/Modify

### New files
- `src/app/globals.css` — brutalist tokens, no rounded corners, no shadows, no transitions
- `src/app/page.tsx` — rewrite with new sections
- `src/components/Hero.tsx` — new hero
- `src/components/Results.tsx` — new results section
- `src/components/Docs.tsx` — new docs with diagrams
- `src/components/Guide.tsx` — new how-it-works section
- `src/components/Footer.tsx` — new footer
- `src/components/DemoProvider.tsx` — seeded demo data context
- `docs/demo/SEEDED_DATA.ts` — mock scan results for demo mode

### Modified files
- `src/components/Nav.tsx` — update links, brutalist styling
- `src/components/ScoreCard.tsx` — brutalist rewrite
- `src/components/ViolationCard.tsx` — brutalist rewrite
- `src/components/PRCard.tsx` — brutalist rewrite
- `src/components/ScanForm.tsx` — brutalist rewrite, phase text
- `src/components/Tabs.tsx` — brutalist rewrite
- `package.json` — name, description updated

### Deleted files
- `src/components/Card.tsx` — no shared card component
- `src/components/FilterBar.tsx` — removed
- `src/components/Dashboard.tsx` — replaced by Results
- `src/components/ForgeHero.tsx` — replaced by new Hero
- `src/components/DocsPage.tsx` — replaced by new Docs
- `src/components/HowItWorksSection.tsx` — replaced by new Guide
- `src/components/states.tsx` — empty states handled inline
- `src/components/Stepper.tsx` — removed, no stepper needed
- `src/components/ConfirmDialog.tsx` — removed, inline confirmation

## Not Changing

Backend is battle-tested, 92% coverage, robust error handling. Keep:
- All 6 API routes (scan, prioritize, pr, report, pdf, badge)
- All 8 scanner modules (contrast, keyboard, headings, links, screen-reader, ast-scanner, confidence, violation-meta)
- Error hierarchy (AppError + withErrorHandler)
- Logger + Sentry instrumentation
- Rate limiter (memory-based)
- Zod validation schemas
- Coalesce (request dedup)
- Cache layer (10min TTL)
- Security headers middleware
- Environment validation
- Test suite (121 tests)
- Coverage gate (80%)
- Size-limit budget (200 KB)

## Implementation Order

1. Globals.css — brutalist tokens
2. Nav — brutalist rewrite
3. Hero — new component
4. ScanForm — brutalist rewrite
5. Guide — new How It Works
6. Results — new section (ScoreCard, ViolationCard, PRCard, Tabs)
7. Docs — rich documentation with diagrams
8. Footer — new
9. Demo mode — seeded data for judges
10. Page.tsx — wire all sections
11. Delete old files (Card, FilterBar, Dashboard, ForgeHero, etc.)
12. Verify all tests still pass
13. Build + size check
14. Commit & push

## Spec Self-Review

- [ ] No placeholders ("TBD", "TODO") — all sections filled
- [ ] Internal consistency: brutalist everywhere in app UI, rich in docs — clean boundary
- [ ] Scope: frontend rewrite only, backend untouched — focused
- [ ] Ambiguity check: "rich documentation" means Mermaid diagrams in docs section, not in app UI — explicit
