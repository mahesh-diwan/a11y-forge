# a11y-forge: I Built an Autonomous Accessibility Scanner That Grades Any GitHub Repo A+ to F in 2 Minutes

**Try it:** [a11y-forge.vercel.app](https://a11y-forge.vercel.app) ·
**Watch it:** [youtu.be/PXrNsw4tF8I](https://youtu.be/PXrNsw4tF8I) ·
**Code:** [github.com/mahesh-diwan/a11y-forge](https://github.com/mahesh-diwan/a11y-forge)

---

> **📸 Upload:** `public/screenshots/a11y-home.png` — drag this into the editor here (hero screenshot with scan input + how it works)

---

## The Problem: A Billion Users Can't Be Wrong

**1 in 6 people worldwide** have a disability. Over a billion humans.

Every day they encounter websites that simply don't work for them:

- Text too light to read against the background
- Navigation that requires a mouse — impossible if you can't use one
- Images that screen readers can't describe
- Forms that don't explain what went wrong
- Timeouts that expire before someone finishes filling a form

The standards exist. WCAG 2.2 AA is a comprehensive 1,400+ page guide telling developers exactly how to build accessible websites.

Yet **96% of home pages** still have detectable accessibility errors (WebAIM, 2024).

Why? Not because developers are malicious. Because the tooling ecosystem failed them:

| Barrier    | Reality                                        |
| ---------- | ---------------------------------------------- |
| Cost       | Professional audits start at $10,000+          |
| Time       | Manual testing takes hours per page            |
| Complexity | 1,400+ pages of guidelines to internalize      |
| Priority   | Features ship first. Accessibility is "later." |

The result: a billion people face broken websites daily. A tooling gap, not a caring gap.

---

## The Idea: Paste URL. Get Grade. Fix It.

What if checking accessibility was as frictionless as pasting a link?

No configuration. No signup. No credit card. No cost.

**a11y-forge is exactly that.** Paste any public GitHub repository URL, wait ~2 minutes, and get:

- **A+ to F accessibility score** — like a report card for your code
- **Every violation listed** — file path, line number, severity, explanation
- **AI-powered grouping** — violations sorted by impact, not alphabetically
- **HTML + PDF reports** — compliance documentation ready to file
- **SVG badge** — embed your score in any README
- **Screen reader preview** — experience your site as a blind user would

> **📸 Upload:** `public/screenshots/a11y-results-top.png` — drag here (scan results showing score + violations)

---

## How It Works: The Pipeline

Four stages. Two minutes. One report card.

> **📸 Upload:** `public/screenshots/a11y-pipeline-cards.png` — drag here (4-step pipeline from the live app: Scan → Group → Fix → PR)

### Stage 1 — Scan

a11y-forge fetches the repository tree via the GitHub Git Data API and downloads up to 150 source files — HTML, JSX, TSX, Vue, Svelte, CSS.

Then it runs **12 distinct WCAG 2.2 AA check types** against every file, using a mix of AST parsing (via @babel/parser), CSS property inspection, and regex pattern matching. No browser required — it's all static analysis.

| Check                   | WCAG Criterion | What It Catches                                    |
| ----------------------- | -------------- | -------------------------------------------------- |
| Color contrast          | 1.4.3 AA       | Text that blends into background                   |
| Keyboard trap           | 2.1.2 AA       | Elements unreachable via keyboard                  |
| Heading hierarchy       | 1.3.1 AA       | Wrong H1 → H2 → H3 ordering                        |
| Link text               | 2.4.4 AA       | "Click here" — links without purpose               |
| ARIA attributes         | 4.1.2 AA       | Missing or broken ARIA properties                  |
| Image alt text          | 1.1.1 AA       | Images without descriptions                        |
| Form labels             | 1.3.1 AA       | Inputs without associated labels                   |
| Language attribute      | 3.1.1 AA       | Missing `lang` on `<html>`                         |
| Focus order             | 2.4.3 AA       | Tabindex values that break flow                    |
| Non-text content        | 1.1.1 AA       | Missing alt on buttons and icons                   |
| Error identification    | 3.3.1 AA       | Forms without error messages                       |
| Sensory characteristics | 1.3.3 AA       | "Click the green button" — color-only instructions |

> **📸 Upload:** `public/screenshots/a11y-scanner-table.png` — drag here (full scanner reference from docs)

### Stage 2 — Prioritize

Raw violations are sent to **GPT-5.6-sol**, which:

1. Groups them by WCAG category
2. Ranks groups by real human impact

A keyboard trap that blocks blind users scores higher than a missing language attribute. The AI understands context.

**No API key configured?** Deterministic fallback sorts by severity. Still works.

### Stage 3 — Fix

For each violation group, a11y-forge generates semantic diffs, creates one Git branch per category (`a11y-fix-color-contrast`, `a11y-fix-keyboard-trap`), and opens pull requests. Developers review, tweak, merge.

### Stage 4 — Report

> **📸 Upload:** `public/screenshots/a11y-docs.png` — drag here (API documentation + curl examples)

Everything you need to act:

- **Score card** — A+–F grade with color-coded breakdown
- **HTML report** — Full violation details for team review
- **PDF report** — Compliance documentation for auditors
- **SVG badge** — Drop into your README, show the world
- **Screen reader preview** — Hear what assistive tech users experience

---

## Built With Codex + GPT-5.6

Built during OpenAI Build Week 2026, a11y-forge runs on two AI layers.

**Runtime — GPT-5.6.** The `/api/prioritize` endpoint calls `gpt-5.6-sol` to transform raw scan output into intelligent, human-impact-ranked fix groups. The model understands accessibility — it evaluates impact, not just keywords.

**Development — Codex CLI.** The entire project was built through conversational AI pair programming. Codex CLI handled scaffolding API routes from natural-language descriptions, implementing all 12 WCAG check types across file formats, building a responsive dark dashboard, diagnosing a Next.js 16.2 CSP crash that broke production, fixing mobile overflow on results tables, and maintaining 165 unit tests plus 3 Playwright e2e tests throughout.

Key decisions — the pipeline architecture, deterministic fallback design, accessibility-first error patterns — all emerged through AI-guided design exploration.

---

## Tech Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Framework      | Next.js 16.2 App Router  |
| Language       | TypeScript 5             |
| Styling        | Tailwind CSS v4          |
| GitHub API     | Octokit v5               |
| AI Runtime     | OpenAI SDK (GPT-5.6-sol) |
| AST Parsing    | @babel/parser            |
| PDF Generation | pdf-lib                  |
| Testing        | vitest + Playwright      |
| Deployment     | Vercel                   |

---

## Who Actually Benefits

**Developers.** Stop guessing. Every violation includes a file path and line number. The A+–F score gamifies improvement — nobody wants to ship with a D.

**Open source maintainers.** 96% of OSS projects never get an accessibility audit. Commercial audits cost thousands. a11y-forge is **free, open source, and zero-config**. Run it, get a score, add the badge, show your community you care.

**Companies.** ADA website lawsuits exceeded 4,000 in 2024. a11y-forge provides hard evidence: HTML reports for team sprints, PDF exports for compliance audits.

**Users with disabilities.** This is the real point. Every violation a11y-forge finds is a website that someone couldn't use. Fixing even one — a missing alt text, a keyboard trap — directly improves someone's day.

---

## Try It Yourself

The demo is live. Free. No account. No credit card.

👉 **[a11y-forge.vercel.app](https://a11y-forge.vercel.app)** — paste any public GitHub repo

🎬 **[Demo video](https://youtu.be/PXrNsw4tF8I)** — 1m54s walkthrough

📦 **[GitHub](https://github.com/mahesh-diwan/a11y-forge)** — MIT licensed, PRs welcome

Two minutes. Paste a URL. See your score. Fix what matters.

---

_Built during OpenAI Build Week 2026 with Codex CLI + GPT-5.6. MIT licensed._
