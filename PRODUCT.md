# Product

## Register

product

## Platform

web

## Users

Primary: developers and repository maintainers who own a public GitHub repo and want accessibility violations fixed without doing the work by hand. Context: they paste a repo URL, watch the tool scan, grade, and open pull requests with the fixes.

Secondary: technical leads reviewing the generated PRs before merge. Tertiary: accessibility specialists using the deep report views (violation drill-down, screen reader preview, diff).

## Product Purpose

Automated WCAG-fixing tool. Scans a repo's source for accessibility violations, grades it, shows what a screen reader would hear, and opens pull requests with minimal behavior-preserving fixes — end to end. Success: a clean fix PR opened for a real repo with zero manual a11y work from the user.

## Positioning

Automated accessibility from commit to PR — no expertise required.

## Brand Personality

Warm, capable, reliable. More human than a typical dev tool — precise enough to trust, approachable enough to use without a manual. Voice is direct and confident but never cold.

## Anti-references

Generic SaaS default — warm-cream/blue palettes, hero-metric big-number templates, decorative glassmorphism, identical card grids, eyebrow scaffolding on every section. Also: cold dark-mode dev tools with a single neon accent — the "AI template" look. equity should read as a serious instrument with warmth, not as a template.

## Design Principles

- Practice what it preaches: the interface is itself accessible (focus, contrast, reduced-motion).
- Warmth without decoration: every panel earns its place from the workflow, not from a layout template.
- Show, don't tell: the live forge demo is the proof, not a screenshot.
- One bold moment per screen; everything else stays quiet and disciplined.
- Break the grid when it matters: asymmetry signals intent.

## Accessibility & Inclusion

WCAG 2.1 AA. Honor `prefers-reduced-motion` (already wired into reveal animations). Maintain ≥4.5:1 body contrast and visible focus rings throughout. Accessibility tool must be accessible.
