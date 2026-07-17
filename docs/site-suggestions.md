# Site Suggestions — Accessibility Forge

Recommendations for additional content/features to display on site.

---

## 1. Live API Playground

**Description:** Interactive endpoint tester embedded on page. Users send requests to `/api/scan`, `/api/prioritize`, `/api/pr` directly from browser — see raw request/response payloads. Shows rate limits, required headers, error shapes.

**Where:** New "API" tab in nav, or a collapsible section inside documentation bezel.

**Effort:** Medium — needs fetch wrapper + JSON editor + response renderer. Existing endpoints already work; just need UI shell.

---

## 2. WCAG Violation Reference Table

**Description:** Full table of all violation types Forge detects. Columns: violation ID, WCAG criterion, severity level, description, example fix. Users learn what each violation means without running a scan.

**Where:** New subsection inside documentation (below troubleshooting) or standalone `#reference` section.

**Effort:** Low — static data table. Pull from existing violation types in codebase.

---

## 3. Demo Results Carousel

**Description:** Pre-scanned example repos showing their score, violation count, grade. Carousel or grid of 3-5 example scans. "Try it yourself" CTA pre-fills input with that repo URL.

**Where:** Between hero and How It Works, or as a row in dashboard empty state.

**Effort:** Medium — needs static JSON data for examples, carousel UI component, smooth transitions.

---

## 4. Usage Stats / Rate Limiting Info

**Description:** Show current API usage — requests this hour, remaining capacity, rate limit reset time. Optional: total repos scanned, violations found, PRs created (global counters).

**Where:** Bottom of nav, or footer badge, or a small widget on dashboard sidebar.

**Effort:** Low — if tracking exists in backend. Medium — if counters need to be built.

---

## 5. Badge Embed Instructions

**Description:** Short guide showing how to embed the SVG accessibility badge in a README. Copy-paste markdown snippet. Preview of what badge looks like.

**Where:** Inside documentation subsection, or a small "Embed" button on the download report row.

**Effort:** Low — static markdown snippet + badge preview image.

---

## 6. Scan History (localStorage)

**Description:** Persist past scan results in browser localStorage. Show recent scans list — repo URL, score, grade, timestamp. Click to restore previous results.

**Where:** Dashboard sidebar or collapsible panel below input form.

**Effort:** Medium — needs localStorage wrapper, history UI component, serialization of ScanResult type.

---

## 7. Light Mode Toggle

**Description:** Toggle switch in nav to swap between dark/light themes. Persist preference in localStorage. Light mode improves readability for some users and demonstrates accessibility awareness.

**Where:** Nav bar, right side near hamburger menu.

**Effort:** Low — CSS variable swap, toggle component, localStorage preference. Site already uses CSS vars for all colors.
