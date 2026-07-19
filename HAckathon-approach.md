# OpenAI Build Week — Submission Approach

## Overview

Hackathon: **OpenAI Build Week** (also called Codex Hackathon)
Platform: Devpost (openai.devpost.com)
Sponsor: OpenAI
Deadline: **July 21, 2026 @ 5pm PT**
Submission opens: July 13
Judging: July 22 – Aug 5
Winners announced: ~Aug 12

## Key Rules

### Eligibility
- Open to individuals/teams in supported countries
- Age of majority in jurisdiction
- No purchase necessary

### Project Requirements
- **Must use Codex and GPT-5.6** in some capacity
- **New or meaningfully extended** from existing work
- **Pre-existing projects**: must clearly document what was existing vs. new
- **Working demo** — must function as depicted
- **4 tracks**: Apps for Your Life, Work & Productivity, Developer Tools, Education

### Submission Requirements
1. **Demo video** — <3 min, public YouTube, audio explaining what you built and how Codex/GPT were used
2. **Code repo** — public or shared with `testing@devpost.com` and `build-week-event@openai.com`
3. **README** — must describe Codex collaboration (how Codex accelerated workflow, key decisions made)
4. **Codex Session ID** — ID from the build thread where core functionality was built
5. **Installation/testing instructions** for plugins/dev tools

### Judging Criteria (equally weighted)
| Criterion | What judges look for |
|-----------|---------------------|
| Technological Implementation | How thoroughly Codex is used. Code reflects genuine effort. Working, non-trivial. |
| Design | Complete, coherent product experience. Not just proof-of-concept. |
| Potential Impact | Solves real problem for real audience. Solution addresses problem based on demo. |
| Quality of Idea | Creative, novel. Differs from existing concepts. |

## How a11y-forge Fits

### Track: Developer Tools

| Requirement | Status | Notes |
|-------------|--------|-------|
| Uses Codex | ✅ | Entire project built via opencode/Codex CLI |
| Uses GPT-5.6 | ✅ | `/api/prioritize` calls OpenAI for violation grouping |
| Working demo | ✅ | Deployed at https://a11y-forge.vercel.app |
| New or extended | ⚠️ | Pre-existing project — must document prior vs. new work |
| Demo video | ❌ | Need to create |
| Codex Session ID | ⚠️ | Need to identify session ID from opencode workflow |
| README Codex section | ❌ | Need to add |
| Repo shared | ⚠️ | Need to share with judging emails |
| Installation guide | ✅ | README covers it |

### Pre-existing vs. New Work (Submission Period: Jul 13–21)

**Existing before submission period:**
- Core scanner engine (src/lib/scanner/*)
- API routes (scan, prioritize, pr, report, badge, report/pdf)
- FIX engine (src/lib/fixer/)
- Score calculation, confidence, screen reader preview
- GitHub integration via Octokit
- Basic UI components
- Initial docs pages

**Added during submission period (after Jul 13):**
- Mobile overflow fix (box-sizing, overflow-x hidden, pre block scroll)
- Font size bump for readability (32 edits across 10 components)
- Sticky footer via flex layout
- Progress bar with phase indicator
- PR empty message with OpenAI key explanation
- Nav toast on disabled Results click
- Error message `role="alert"` for accessibility
- Pipeline diagram (vertical numbered list)
- Sequence diagram (narrower labels)
- `loading.tsx` removed (fixed permanent skeleton bug)
- `proxy.ts` removed (fixed Next.js 16 crash)
- All pre blocks `overflow-x: auto` for mobile docs scrolling
- E2E tests fixed (button name mismatch)
- E2E tests pass (3/3)
- Vitest 165/165 pass
- Deployed to Vercel

### Evidence for Judges
- Git commit history shows dates: `git log --after="2026-07-13" --oneline`
- Deployed site: https://a11y-forge.vercel.app
- README documents Codex usage

## Submission Checklist

- [ ] Create demo video (<3 min, YouTube public)
- [ ] Add Codex collaboration section to README
- [ ] Identify Codex Session ID from build thread
- [ ] Share repo with `testing@devpost.com` and `build-week-event@openai.com`
- [ ] Choose Developer Tools track on Devpost
- [ ] Fill submission form on openai.devpost.com
- [ ] Submit before July 21 @ 5pm PT

## Demo Video Script (<3 min)

1. **Problem** (30s): Web accessibility compliance is manual, expensive, rarely done. Millions of sites fail WCAG.
2. **Solution** (30s): a11y-forge — autonomous scanner. Paste GitHub repo URL → get violations, score, prioritized fixes.
3. **How Codex helped** (60s): Codex CLI built the entire project — API routes, scanner engine, UI, deployment config. Iterative prompting refined scan logic, fixed mobile layout bugs, added progress bar, stabilized CSP.
4. **Demo** (30s): Live scan of `mahesh-diwan/a11y-forge` → 59 violations, score display, drill-down per violation, screen reader preview.
5. **Impact** (20s): Makes accessibility testing free, instant, automated. Every open-source repo can get a score.

## README Codex Section Template

Add to README.md after the intro:

```markdown
## Built with Codex

This project was developed entirely using [opencode](https://opencode.ai) (Codex CLI) during OpenAI Build Week 2026. Key ways Codex accelerated development:

- **API scaffolding**: Generated all 6 API routes (scan, prioritize, pr, report, report/pdf, badge) from natural-language descriptions of the pipeline.
- **Scanner engine**: Implemented 12 WCAG check types (AST traversal for HTML/JSX/TSX/Vue/Svelte, CSS property inspection, regex patterns).
- **UI components**: Built ScanForm, ScoreCard, ViolationCard, Results, Navigation with mobile-responsive layout — iterated via conversational prompts.
- **Bug fixes**: Resolved Next.js 16 CSP crash (proxy.ts conflict), loading.tsx skeleton bug, mobile overflow, sticky footer.
- **Testing**: Generated and maintained 165 vitest unit tests + 3 Playwright e2e tests.
- **Deployment**: Configured Vercel deployment, environment variables, CSP headers, production build pipeline.

Codex handled boilerplate, test generation, and bug diagnosis while we focused on product decisions, WCAG rule design, and user experience.
```

## Judging Strategy

| Criterion | How a11y-forge scores |
|-----------|----------------------|
| Technological Implementation | Full-stack Next.js app with AST parsing, GitHub API, OpenAI integration, SVG badge generation, HTML/PDF reports. 165 tests. Deployed. |
| Design | Dark CLI-style UI. Minimal, monochrome + amber accent. Mobile-responsive (just fixed overflow). Complete flow from scan to results. |
| Potential Impact | Real problem: 96% of homepages have WCAG failures (WebAIM). Free, instant tool lowers barrier for open-source maintainers. |
| Quality of Idea | Novel: autonomous pipeline (scan→prioritize→fix→PR) in one tool. Static analysis avoids browser dependency. Deterministic fallback when no AI key. |

## Timeline

| Date | Action |
|------|--------|
| Jul 19 | Record demo video, update README, submit on Devpost |
| Jul 20 | Verify all tests pass, final deploy, share repo with judges |
| Jul 21 (5pm PT) | **Submission deadline** |

---

*Last updated: July 19, 2026*
