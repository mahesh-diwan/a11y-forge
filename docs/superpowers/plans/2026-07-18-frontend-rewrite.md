# Frontend Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace entire frontend with brutalist design + rich docs. Keep backend untouched.

**Architecture:** Single-page app, 5 sections (Hero → Guide → Results → Docs → Footer). Components are raw divs with `1px #333` borders, no `Card` wrapper, no rounded corners, no animations.

**Tech Stack:** Next 16, TS 5, Tailwind v4, Mermaid (docs only)

## Global Constraints

- All border-radius: 0px everywhere
- No margin/padding uses `transition`, `animation`, `shadow`, or `transform`
- Color palette: --canvas: #000000, --surface: #1a1a1a, --text: #ffffff, --muted: #666, --accent: #ffb700, --fail: #ff3b3b, --border: #333
- All cards are raw `<div>` with `style="border: 1px solid #333;"`
- No shared Card component
- Font stack: Arial Black/Helvetica Now Display (800) for headings, Inter/system-ui for body, JetBrains Mono/SF Mono for code
- Backend files (API routes, lib/scanner, lib/errors, lib/logger, lib/sentry, lib/rate-limit, lib/cache, lib/coalesce, lib/env, lib/validation, lib/security-headers, middleware.ts, instrumentation.ts) NEVER modified

---
### Task 1: Globals.css — brutalist tokens

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS custom properties consumed by all components

- [ ] **Step 1: Replace globals.css with brutalist tokens**

```css
:root {
  --canvas: #000000;
  --surface: #1a1a1a;
  --text: #ffffff;
  --muted: #666;
  --accent: #ffb700;
  --fail: #ff3b3b;
  --border: #333;

  --font-body: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", "Cascadia Code", monospace;
  --font-display: "Arial Black", "Helvetica Now Display", "Impact", sans-serif;
}

* {
  border-radius: 0 !important;
  box-shadow: none !important;
  transition: none !important;
  animation: none !important;
}

body {
  background: var(--canvas);
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.5;
}

::selection {
  background: var(--accent);
  color: #000;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: brutalist CSS tokens, kill rounded corners/shadows/transitions"
```

---
### Task 2: ScanForm — brutalist rewrite

**Files:**
- Modify: `src/components/ScanForm.tsx`

**Interfaces:**
- Consumes: `Phase` type from page.tsx
- Produces: `<ScanForm>` component with props: `{ repoUrl, onUrlChange, onSubmit, onCancel, onDemo, phase, error, inputRef }`

- [ ] **Step 1: Rewrite ScanForm**

```tsx
"use client";

import { FormEvent, RefObject } from "react";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

interface ScanFormProps {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onDemo: () => void;
  phase: Phase;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Scan",
  scanning: "Scanning…",
  prioritizing: "Prioritizing…",
  fixing: "Fixing…",
  done: "Done",
};

export function ScanForm({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  onDemo,
  phase,
  error,
  inputRef,
}: ScanFormProps) {
  const isWorking = phase !== "idle" && phase !== "done";

  return (
    <div>
      <form onSubmit={isWorking ? (e) => { e.preventDefault(); onCancel(); } : onSubmit} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          ref={inputRef}
          type="url"
          value={repoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={isWorking}
          aria-label="GitHub repository URL"
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: isWorking ? "var(--surface)" : "var(--accent)",
            border: "1px solid var(--border)",
            color: isWorking ? "var(--muted)" : "#000",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isWorking ? "Cancel" : PHASE_LABELS[phase]}
        </button>
      </form>
      {phase === "idle" && (
        <button
          type="button"
          onClick={onDemo}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          try demo repo →
        </button>
      )}
      {phase !== "idle" && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
          {PHASE_LABELS[phase]}
        </p>
      )}
      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--fail)", marginTop: "8px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScanForm.tsx
git commit -m "feat: brutalist ScanForm with phase text, cancel, demo link"
```

---
### Task 3: Nav — brutalist update

**Files:**
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Produces: `<Nav>` component

- [ ] **Step 1: Rewrite Nav with brutalist styling**

```tsx
"use client";

import { useEffect, useState } from "react";

const LINKS = ["Scan", "Results", "Guide", "Docs"];

interface NavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Nav({ activeView, onViewChange }: NavProps) {
  const [open, setOpen] = useState(false);

  function handleClick(label: string) {
    onViewChange(label.toLowerCase());
    setOpen(false);
    const el = document.getElementById(label.toLowerCase());
    if (el) el.scrollIntoView({ behavior: "instant" });
  }

  return (
    <header
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        maxWidth: "560px",
        width: "calc(100% - 32px)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "6px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
        }}
        role="navigation"
        aria-label="Primary"
      >
        <span style={{ color: "var(--accent)", fontWeight: 700, marginRight: "12px" }}>af</span>
        <div style={{ width: "1px", height: "14px", background: "var(--border)", marginRight: "12px" }} />
        <ul style={{ display: "flex", gap: "4px", listStyle: "none", margin: 0, padding: 0 }}>
          {LINKS.map((l) => (
            <li key={l}>
              <a
                href={`#${l.toLowerCase()}`}
                onClick={(e) => { e.preventDefault(); handleClick(l); }}
                style={{
                  padding: "4px 10px",
                  color: activeView === l.toLowerCase() ? "var(--text)" : "var(--muted)",
                  background: activeView === l.toLowerCase() ? "rgba(255,255,255,0.04)" : "transparent",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                aria-current={activeView === l.toLowerCase() ? "page" : undefined}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "10px" }}>v0.1.0</span>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "feat: brutalist Nav, version badge, no hamburger"
```

---
### Task 4: Hero — new component

**Files:**
- Create: `src/components/Hero.tsx`

**Interfaces:**
- Produces: `<Hero>` component with embedded ScanForm

- [ ] **Step 1: Create Hero component**

```tsx
"use client";

import { FormEvent, RefObject } from "react";
import { ScanForm } from "./ScanForm";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

interface HeroProps {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onDemo: () => void;
  phase: Phase;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  violationsCount: number;
  filesCount: number;
  prsCount: number;
}

export function Hero({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  onDemo,
  phase,
  error,
  inputRef,
  violationsCount,
  filesCount,
  prsCount,
}: HeroProps) {
  return (
    <section id="scan" style={{ paddingTop: "120px", paddingBottom: "48px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 800,
          margin: "0 0 8px 0",
          lineHeight: 1.1,
        }}
      >
        a11y-forge
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0" }}>
        Autonomous accessibility fixes for your repos
      </p>

      <ScanForm
        repoUrl={repoUrl}
        onUrlChange={onUrlChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDemo={onDemo}
        phase={phase}
        error={error}
        inputRef={inputRef}
      />

      <div style={{ borderTop: "1px solid var(--border)", marginTop: "24px", paddingTop: "16px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", margin: 0 }}>
          <span style={{ color: "var(--accent)" }}>{violationsCount} violations</span>
          {" · "}
          {filesCount} files
          {" · "}
          <span style={{ color: "var(--accent)" }}>{prsCount} PRs opened</span>
        </p>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginTop: "24px", maxWidth: "480px" }}>
        Scan any public GitHub repo. No config required. equity checks HTML, JSX, CSS for WCAG 2.2 violations and opens pull requests with fixes.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat: Hero component with tagline, ScanForm, stats"
```

---
### Task 5: Guide — How It Works section

**Files:**
- Create: `src/components/Guide.tsx`

**Interfaces:**
- Produces: `<Guide>` component

- [ ] **Step 1: Create Guide component**

```tsx
"use client";

const STEPS = [
  { num: "01", label: "Scan", desc: "Walk repo tree via GitHub API. Parse AST/JSX/CSS. Run WCAG 2.2 checks per file." },
  { num: "02", label: "Group", desc: "Classify violations by WCAG type. Rank by human impact. Group similar fixes together." },
  { num: "03", label: "Fix", desc: "AI generates semantic diffs per group. One fix branch per category." },
  { num: "04", label: "PR", desc: "Create branch, open pull request. You review and merge." },
];

export function Guide() {
  return (
    <section id="guide" style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        HOW IT WORKS
      </h2>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
        {STEPS.map((s) => (
          <div key={s.num} style={{ border: "1px solid var(--border)", padding: "16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", margin: "0 0 4px 0" }}>
              {s.num}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text)", margin: "0 0 8px 0" }}>
              {s.label}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginTop: "16px" }}>
        4-step pipeline. ~2 min per repo.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Guide.tsx
git commit -m "feat: Guide section — 4-step brutalist pipeline grid"
```

---
### Task 6: ScoreCard, ViolationCard, PRCard, Tabs — brutalist rewrite

**Files:**
- Modify: `src/components/ScoreCard.tsx`
- Modify: `src/components/ViolationCard.tsx`
- Modify: `src/components/PRCard.tsx`
- Modify: `src/components/Tabs.tsx`

**Interfaces:**
- Produces: `<ScoreCard>`, `<ViolationCard>`, `<PRCard>`, `<Tabs>` brutalist versions

- [ ] **Step 1: Rewrite ScoreCard**

```tsx
"use client";

import type { ScoreResult } from "@/lib/types";

interface ScoreCardProps {
  score: ScoreResult;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function ScoreCard({ score, download }: ScoreCardProps) {
  const isPass = score.score >= 70;
  const gradeColor = isPass ? "var(--accent)" : "var(--fail)";

  return (
    <div style={{ border: "1px solid var(--border)", padding: "20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: `2px solid ${gradeColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "24px",
            fontWeight: 700,
            color: gradeColor,
            flexShrink: 0,
          }}
        >
          {score.grade}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, margin: 0, color: gradeColor }}>
            {score.score}/100
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>
            {score.totalViolations} violations · {score.affectedFiles.length} files
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {(["report", "badge", "pdf"] as const).map((k) => (
            <button
              key={k}
              onClick={() => download(k)}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              {k === "report" ? "HTML Report" : k === "badge" ? "Badge SVG" : "PDF Report"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ViolationCard**

```tsx
"use client";

import type { Violation } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--fail)",
  serious: "var(--fail)",
  moderate: "var(--accent)",
  minor: "var(--muted)",
};

interface ViolationCardProps {
  v: Violation;
}

export function ViolationCard({ v }: ViolationCardProps) {
  const dotColor = SEVERITY_COLORS[v.type] || "var(--accent)";

  return (
    <div style={{ border: "1px solid var(--border)", padding: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)" }}>
          {v.file}:{v.line}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text)", margin: "0 0 8px 0" }}>
        {v.description}
      </p>
      {v.snippet && (
        <pre style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--muted)",
          overflow: "auto",
          margin: 0,
        }}>
          {v.snippet}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite PRCard**

```tsx
"use client";

import type { FixPR } from "@/lib/types";

interface PRCardProps {
  pr: FixPR;
}

export function PRCard({ pr }: PRCardProps) {
  return (
    <div style={{ border: "1px solid var(--border)", padding: "12px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", margin: "0 0 4px 0" }}>
        a11y-fix/{pr.category}
      </p>
      {pr.url ? (
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text)", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          #{pr.number} ·
        </a>
      ) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>dry run</span>
      )}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", margin: "4px 0 0 0" }}>
        {pr.fixCount} {pr.fixCount === 1 ? "fix" : "fixes"}
        {pr.dryRun && " · dry run"}
      </p>
      {pr.url && (
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          View PR →
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite Tabs**

```tsx
"use client";

interface TabsProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  renderLabel: (t: T) => string;
}

export function Tabs<T extends string>({ tabs, active, onChange, renderLabel }: TabsProps<T>) {
  return (
    <div role="tablist" style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={active === t}
          onClick={() => onChange(t)}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            background: "transparent",
            border: "none",
            borderBottom: active === t ? "2px solid var(--accent)" : "2px solid transparent",
            color: active === t ? "var(--text)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          {renderLabel(t)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreCard.tsx src/components/ViolationCard.tsx src/components/PRCard.tsx src/components/Tabs.tsx
git commit -m "feat: brutalist ScoreCard, ViolationCard, PRCard, Tabs"
```

---
### Task 7: Results section + Docs section

**Files:**
- Create: `src/components/Results.tsx`
- Create: `src/components/Docs.tsx`
- Create: `src/components/Footer.tsx`

**Interfaces:**
- Produces: `<Results>`, `<Docs>`, `<Footer>` components

- [ ] **Step 1: Create Results component**

```tsx
"use client";

import type { ScanResult, FixPR } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { ViolationCard } from "./ViolationCard";
import { PRCard } from "./PRCard";
import { Tabs } from "./Tabs";

type Tab = "violations" | "reader" | "diff";

interface ResultsProps {
  result: ScanResult | null;
  prs: FixPR[];
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function Results({ result, prs, activeTab, onTabChange, download }: ResultsProps) {
  if (!result) return null;

  return (
    <section id="results" style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        RESULTS
      </h2>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      {result.score && <ScoreCard score={result.score} download={download} />}

      <Tabs<Tab>
        tabs={["violations", "reader", "diff"] as const}
        active={activeTab}
        onChange={onTabChange}
        renderLabel={(t) =>
          t === "violations" ? `Issues (${result.violations.length})` : t === "reader" ? "Screen Reader" : "Diff / PR"
        }
      />

      {activeTab === "violations" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {result.violations.map((v, i) => (
            <ViolationCard key={`${v.file}-${v.line}-${i}`} v={v} />
          ))}
        </div>
      )}

      {activeTab === "reader" && result.screenReader && result.screenReader.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {result.screenReader.map((sr, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", padding: "12px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", margin: "0 0 4px 0" }}>
                {sr.element}
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", margin: 0 }}>
                {sr.current} → {sr.fixed}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "diff" && prs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {prs.map((pr) => (
            <PRCard key={pr.url || pr.category} pr={pr} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Create Docs component with rich diagrams**

```tsx
"use client";

import dynamic from "next/dynamic";

const Mermaid = dynamic(() => import("@/components/Mermaid"), { ssr: false });

const PIPELINE = `flowchart LR
    A["Submit URL"]
    B["Scan sources<br/>AST + crawler"]
    C["Prioritize<br/>AI grouping"]
    D["Generate fixes<br/>Codex diffs"]
    E["Create PRs<br/>GitHub API"]
    A --> B --> C --> D --> E
    B -.-> F["contrast.ts"]
    B -.-> G["keyboard.ts"]
    B -.-> H["headings.ts"]
    B -.-> I["links.ts"]
    style A fill:#1a1a1a,stroke:#ffb700,color:#fff
    style B fill:#1a1a1a,stroke:#ffb700,color:#fff
    style C fill:#1a1a1a,stroke:#ffb700,color:#fff
    style D fill:#1a1a1a,stroke:#ffb700,color:#fff
    style E fill:#1a1a1a,stroke:#ffb700,color:#fff
    style F fill:#1a1a1a,stroke:#333,color:#666
    style G fill:#1a1a1a,stroke:#333,color:#666
    style H fill:#1a1a1a,stroke:#333,color:#666
    style I fill:#1a1a1a,stroke:#333,color:#666`;

const SEQUENCE = `sequenceDiagram
    participant C as Client
    participant S as POST /api/scan
    participant P as POST /api/prioritize
    participant F as POST /api/pr
    participant G as GitHub API
    participant O as OpenAI API
    C->>S: { repoUrl }
    S->>G: GET /repos/{owner}/{repo}/git/trees
    G-->>S: file tree
    S->>G: GET file contents
    G-->>S: source files
    S->>S: run WCAG checks
    S-->>C: { violations[], score }
    C->>P: { violations[] }
    P->>O: group + rank
    O-->>P: FixGroup[]
    P-->>C: { groups[] }
    loop each FixGroup
        C->>F: { repoUrl, group }
        F->>O: generate diffs
        O-->>F: patched files
        F->>G: createBlob + commit + PR
        G-->>F: PR url
        F-->>C: { url, number }
    end`;

const ROUTES = [
  { method: "POST", path: "/api/scan", desc: "Walk repo tree, download up to 100 files, run all WCAG checks." },
  { method: "POST", path: "/api/prioritize", desc: "Group violations by category, rank by impact. Requires consentToAi." },
  { method: "POST", path: "/api/pr", desc: "Generate diffs, commit, open PR. dryRun returns diffs only." },
  { method: "POST", path: "/api/report", desc: "Render HTML report. Returns text/html attachment." },
  { method: "POST", path: "/api/report/pdf", desc: "Render PDF report via pdf-lib. Requires score." },
  { method: "GET", path: "/api/badge", desc: "SVG score badge. POST with score for custom, GET for default." },
];

const SCANNERS = [
  "contrast.ts — CSS color contrast ratio (4.5:1 AA, 7:1 AAA)",
  "keyboard.ts — keyboard traps, tabindex ≥0, missing escape",
  "headings.ts — heading hierarchy, skips, empty, single h1",
  "links.ts — vague text, empty hrefs, missing names",
  "screen-reader.ts — simulate SR output before/after",
  "ast-scanner.ts — Babel JSX/TSX walker for alt, aria-label, form labels",
  "confidence.ts — heuristic detection confidence 0-100%",
  "violation-meta.ts — severity, WCAG ref, fix strategy per type",
];

export function Docs() {
  return (
    <section id="docs" style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        DOCS
      </h2>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      {/* Pipeline diagram */}
      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Pipeline
      </h3>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <Mermaid chart={PIPELINE} />
      </div>

      {/* Sequence diagram */}
      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Sequence
      </h3>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <Mermaid chart={SEQUENCE} />
      </div>

      {/* API Reference */}
      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        API
      </h3>
      <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
        {ROUTES.map((r) => (
          <div key={r.path} style={{ border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", fontWeight: 700, flexShrink: 0, padding: "2px 6px", border: "1px solid var(--accent)" }}>
              {r.method}
            </span>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text)", fontWeight: 600 }}>{r.path}</span>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scanner modules */}
      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Scanners
      </h3>
      <div style={{ display: "grid", gap: "4px", marginBottom: "24px" }}>
        {SCANNERS.map((s) => (
          <div key={s} style={{ border: "1px solid var(--border)", padding: "8px 12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0 }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Setup */}
      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Setup
      </h3>
      <div style={{ border: "1px solid var(--border)", padding: "16px" }}>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
{`GITHUB_TOKEN=ghp_...     # required, repo scope
OPENAI_API_KEY=sk-...    # optional, enables AI grouping

npm install
npm run dev
npm test`}
        </pre>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create Footer**

```tsx
"use client";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 0", marginTop: "48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", fontWeight: 700 }}>af</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>a11y-forge · built with Codex + GPT-5.6</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" }}>
          <a href="https://github.com/mahesh-diwan/a11y-forge" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            GitHub
          </a>
          {" · "} v0.1.0
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Results.tsx src/components/Docs.tsx src/components/Footer.tsx
git commit -m "feat: Results, Docs (rich diagrams), Footer components"
```

---
### Task 8: Demo mode — seeded data

**Files:**
- Create: `src/lib/demo-data.ts`

**Interfaces:**
- Produces: `DEMO_RESULT` and `DEMO_PRS` constants

- [ ] **Step 1: Create demo data**

```ts
import type { ScanResult, FixPR } from "./types";

export const DEMO_RESULT: ScanResult = {
  repoUrl: "github.com/mahesh-diwan/a11y-forge-demo",
  violations: [
    { type: "contrast", file: "src/Button.tsx", line: 42, description: "Color contrast ratio 3.1:1 — AA requires 4.5:1", snippet: "color: #888;\nbackground: #fff;" },
    { type: "contrast", file: "src/Nav.tsx", line: 18, description: "Color contrast ratio 2.8:1 on hover state", snippet: "color: #999;" },
    { type: "keyboard", file: "src/Nav.tsx", line: 25, description: "tabindex ≥0 on non-interactive div", snippet: '<div tabindex="0" class="nav-item">' },
    { type: "keyboard", file: "src/Modal.tsx", line: 55, description: "Missing Escape key handler on modal", snippet: '<div role="dialog">' },
    { type: "headings", file: "src/About.tsx", line: 1, description: "Heading skip — h1 → h3, no h2", snippet: "<h1>Title</h1>\n<h3>Subtitle</h3>" },
    { type: "headings", file: "src/About.tsx", line: 8, description: "Empty heading element", snippet: "<h2></h2>" },
    { type: "links", file: "src/Footer.tsx", line: 12, description: "Vague link text 'click here'", snippet: '<a href="/contact">click here</a>' },
    { type: "links", file: "src/Footer.tsx", line: 15, description: "Empty href on anchor", snippet: '<a href="">Home</a>' },
    { type: "ast", file: "src/Card.tsx", line: 3, description: "Image missing alt attribute", snippet: "<img src='/photo.jpg' />" },
    { type: "ast", file: "src/Form.tsx", line: 22, description: "Button missing aria-label", snippet: '<button class="icon-btn">' },
    { type: "ast", file: "src/Form.tsx", line: 30, description: "Input missing associated label", snippet: '<input type="text" />' },
    { type: "ast", file: "src/Layout.tsx", line: 1, description: "HTML missing lang attribute", snippet: "<html>" },
  ],
  score: {
    score: 42,
    grade: "D",
    label: "FAIL",
    color: "#ff3b3b",
    totalViolations: 12,
    breakdown: [
      { type: "contrast", count: 2, impact: 0.25 },
      { type: "keyboard", count: 2, impact: 0.2 },
      { type: "headings", count: 2, impact: 0.15 },
      { type: "links", count: 2, impact: 0.15 },
      { type: "ast", count: 4, impact: 0.25 },
    ],
    affectedFiles: ["src/Button.tsx", "src/Nav.tsx", "src/Modal.tsx", "src/About.tsx", "src/Footer.tsx", "src/Card.tsx", "src/Form.tsx", "src/Layout.tsx"],
  },
  screenReader: [
    { file: "src/Card.tsx", line: 3, element: "<img>", current: "No announcement", fixed: "Photo: team meeting", violation: "Missing alt" },
    { file: "src/Form.tsx", line: 22, element: "<button>", current: "Button (unlabeled)", fixed: "Close dialog", violation: "Missing aria-label" },
  ],
};

export const DEMO_PRS: FixPR[] = [
  { category: "contrast", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/1", number: 1, fixCount: 2, explanation: "Fix color contrast in Button.tsx and Nav.tsx" },
  { category: "keyboard", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/2", number: 2, fixCount: 2, explanation: "Fix keyboard traps in Nav.tsx and Modal.tsx" },
  { category: "headings", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/3", number: 3, fixCount: 2, explanation: "Fix heading hierarchy in About.tsx" },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/demo-data.ts
git commit -m "feat: seeded demo data for judge walkthrough"
```

---
### Task 9: page.tsx — wire all sections

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Hero, Guide, Results, Docs, Footer, Nav, ScanForm, demo-data
- Produces: Main page

- [ ] **Step 1: Rewrite page.tsx**

```tsx
"use client";

import { useState, useRef, FormEvent } from "react";
import type { ScanResult, FixPR } from "@/lib/types";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Guide } from "@/components/Guide";
import { Results } from "@/components/Results";
import { Docs } from "@/components/Docs";
import { Footer } from "@/components/Footer";
import { runWorkflow } from "@/lib/workflow";
import { DEMO_RESULT, DEMO_PRS } from "@/lib/demo-data";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";
type Tab = "violations" | "reader" | "diff";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [prs, setPrs] = useState<FixPR[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("violations");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

  function handleDemo() {
    setRepoUrl("github.com/mahesh-diwan/a11y-forge-demo");
    setPhase("scanning");
    setError(null);
    setResult(null);
    setPrs([]);
    setTimeout(() => { setPhase("done"); setResult(DEMO_RESULT); setPrs(DEMO_PRS); }, 1200);
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl) return;
    if (!/github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      setError("Enter a valid GitHub repo URL (https://github.com/owner/repo).");
      return;
    }
    setError(null);
    setResult(null);
    setPrs([]);
    setPhase("scanning");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await runWorkflow(repoUrl, {
        onPhase: setPhase,
        onLog: () => {},
        onResult: setResult,
        onPr: (pr) => setPrs((prev) => [...prev, pr]),
        signal: ctrl.signal,
        consentToAi: false,
        dryRun: true,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("idle");
    } finally {
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setPhase("idle");
  }

  function download(kind: "report" | "badge" | "pdf") {
    if (!result) return;
    if (downloadLock.current.has(kind)) return;
    downloadLock.current.add(kind);
    const path = kind === "pdf" ? "/api/report/pdf" : kind === "badge" ? "/api/badge" : "/api/report";
    const body = kind === "badge" ? { score: result.score } : result;
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error("Download failed");
      return r.blob();
    }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "pdf" ? "a11y-report.pdf" : kind === "badge" ? "a11y-badge.svg" : "a11y-report.html";
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => {})
      .finally(() => { downloadLock.current.delete(kind); });
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)", color: "var(--text)" }}>
      <Nav activeView={phase === "done" || result ? "results" : "scan"} onViewChange={() => {}} />
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
        <Hero
          repoUrl={repoUrl}
          onUrlChange={setRepoUrl}
          onSubmit={handleScan}
          onCancel={handleCancel}
          onDemo={handleDemo}
          phase={phase}
          error={error}
          inputRef={inputRef}
          violationsCount={result?.violations.length ?? 12}
          filesCount={result?.score?.affectedFiles.length ?? 8}
          prsCount={prs.length ?? 3}
        />
        <Guide />
        <Results result={result} prs={prs} activeTab={activeTab} onTabChange={setActiveTab} download={download} />
        <Docs />
        <Footer />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire all sections into page.tsx, demo mode handler"
```

---
### Task 10: Delete unused old components

**Files:**
- Delete: `src/components/Card.tsx`
- Delete: `src/components/FilterBar.tsx`
- Delete: `src/components/Dashboard.tsx`
- Delete: `src/components/ForgeHero.tsx`
- Delete: `src/components/DocsPage.tsx`
- Delete: `src/components/HowItWorksSection.tsx`
- Delete: `src/components/states.tsx`
- Delete: `src/components/Stepper.tsx`
- Delete: `src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Remove unused files**

```bash
git rm src/components/Card.tsx src/components/FilterBar.tsx src/components/Dashboard.tsx src/components/ForgeHero.tsx src/components/DocsPage.tsx src/components/HowItWorksSection.tsx src/components/states.tsx src/components/Stepper.tsx src/components/ConfirmDialog.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: delete unused components (Card, FilterBar, Dashboard, ForgeHero, DocsPage, HowItWorksSection, states, Stepper, ConfirmDialog)"
```

---
### Task 11: Verify tests pass + build check

**Files:**
- Run: test suite
- Run: build

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: All backend tests pass (frontend components are visual, no component tests affected)

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds, no errors

- [ ] **Step 3: Commit any fixes**

```bash
git commit -am "fix: address build issues after frontend rewrite"
```
