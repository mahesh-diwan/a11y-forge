# equity Catalog Grid Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle equity scanner UI to catalog-grid aesthetic inspired by getdesign.md

**Architecture:** Mini hero (no 3D), filter bar + 2-col tight card grid replaces bento dashboard. Hybrid palette: amber `#ffb700` on charcoal `#121212`. Floating pill nav unchanged.

**Tech Stack:** Next 16, Tailwind v4, React 19, TypeScript 5

## Global Constraints

- Keep scan/PR/workflow functionality unchanged.
- Keep amber accent `#ffb700`.
- New bg `#121212`, card surface `#1e1e1e`, hover `#262626`.
- Cards: tight p-4, severity dot + file:line mono + title + snippet. Single-layer card (no double-bezel).
- No 3D, no film grain, no mesh orbs.
- Mini hero ~200px: condensed terminal + input. No 3D backdrop.
- Filter bar: horizontal scrollable tag row, `role="tablist"`.
- Floating pill nav unchanged (color tokens only).
- 121 existing tests must pass.

## Task Plan

### Task 1: CSS tokens + shared Card + FilterBar

**Files:**

- Modify: `src/app/globals.css`
- Create: `src/components/Card.tsx`, `src/components/FilterBar.tsx`
- Delete: `src/components/HeroScene.tsx`

- [ ] **Step 1: Update globals.css tokens**

Replace color variables and remove 3D/film grain:

```css
@theme inline {
  --color-ink: #0a0908;
  --color-canvas: #121212;
  --color-surface: #1e1e1e;
  --color-surface-hover: #262626;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-text: #e8e8e8;
  --color-muted: #888;
  --color-pass: #ffb700;
  --color-pass-bg: rgba(255, 183, 0, 0.12);
  --color-fail: #ff5c5c;
  --color-fail-bg: rgba(255, 92, 92, 0.1);
  --color-focus: #ffb700;
  --font-display: "Syne", sans-serif;
  --font-body: "DM Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --shadow-card: 0 1px 4px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

Remove film grain (body::after with feTurbulence), remove mesh/orb CSS. Keep motion utils.

```css
/* base body */
body {
  background: var(--color-canvas);
  color: var(--color-text);
}
```

- [ ] **Step 2: Create shared Card.tsx**

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${hover ? "transition hover:border-[var(--color-border)]" : ""} ${className}`}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
        ...(hover ? { "--hover-shadow": "var(--shadow-card-hover)" } : {}),
      }}
      onMouseEnter={(e) =>
        hover && (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")
      }
      onMouseLeave={(e) =>
        hover && (e.currentTarget.style.boxShadow = "var(--shadow-card)")
      }
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create FilterBar.tsx**

```tsx
"use client";

const TAGS = [
  "all",
  "missing-alt-text",
  "aria-label",
  "contrast",
  "keyboard",
  "headings",
  "links",
];

interface FilterBarProps {
  active: string;
  onChange: (tag: string) => void;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div
      className="overflow-x-auto"
      role="tablist"
      aria-label="Filter violations"
    >
      <div className="flex gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            role="tab"
            aria-selected={active === tag}
            onClick={() => onChange(tag)}
            className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition"
            style={{
              background:
                active === tag
                  ? "var(--color-pass-bg)"
                  : "var(--color-surface)",
              color:
                active === tag ? "var(--color-pass)" : "var(--color-muted)",
              border: "1px solid",
              borderColor:
                active === tag ? "var(--color-pass)" : "var(--color-border)",
            }}
          >
            {tag.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Delete HeroScene.tsx**

Run: `rm src/components/HeroScene.tsx`

- [ ] **Step 5: Verify**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run`
Expected: tsc clean, tests pass (some may adjust for removed HeroScene import).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/Card.tsx src/components/FilterBar.tsx
git rm src/components/HeroScene.tsx
git commit -m "feat: catalog-grid tokens, shared Card, FilterBar"
```

### Task 2: Mini hero + compact ScanForm + mini Stepper

**Files:**

- Modify: `src/components/ForgeHero.tsx`, `src/components/ScanForm.tsx`, `src/components/Stepper.tsx`

- [ ] **Step 1: Rewrite ForgeHero.tsx → mini hero**

Remove 3D import. Condense to ~200px:

```tsx
"use client";

import { useState, useMemo } from "react";

const SAMPLE = `<img src="/hero.png" />
<button onclick="buy()">Buy</button>
<input type="email" />`;

type Edit = { line: string; kind: "add" | "remove" };

const RULES: { test: RegExp; apply: (m: string) => string }[] = [
  {
    test: /<img[^>]*>/gi,
    apply: (m) =>
      m.replace(/<img([^>]*?)\s*\/?>/i, '<img$1 alt="descriptive image">'),
  },
  {
    test: /<button[^>]*>/gi,
    apply: (m) =>
      m.replace(/<button([^>]*?)>/i, '<button$1 aria-label="action">'),
  },
  {
    test: /<(input|select|textarea)[^>]*>/gi,
    apply: (m) =>
      m.replace(
        /<(input|select|textarea)([^>]*?)>/i,
        '<$1$2 aria-label="field">',
      ),
  },
  {
    test: /<html(?![^>]*\slang=)/i,
    apply: (m) => m.replace(/<html/i, '<html lang="en"'),
  },
];

function forge(src: string): { out: string; count: number } {
  let out = src;
  let count = 0;
  for (const r of RULES) {
    out = out.replace(r.test, (m) => {
      count++;
      return r.apply(m);
    });
  }
  return { out, count };
}

export function ForgeHero() {
  const [src, setSrc] = useState(SAMPLE);
  const { count } = useMemo(() => forge(src), [src]);
  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 font-bold"
          style={{ color: "var(--color-pass)" }}
        >
          $
        </span>
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          spellCheck={false}
          aria-label="Paste HTML markup"
          className="w-full resize-none bg-transparent font-mono text-xs outline-none"
          rows={2}
        />
        <span
          className="shrink-0 text-[10px] font-mono"
          style={{
            color: count > 0 ? "var(--color-pass)" : "var(--color-muted)",
          }}
        >
          {count > 0 ? `${count} fix${count > 1 ? "es" : ""}` : "clean"}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ScanForm.tsx → compact inline**

```tsx
"use client";
import { type FormEvent, type RefObject } from "react";

interface Props {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  phase: string;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function ScanForm({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  phase,
  error,
  inputRef,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={repoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repo URL"
          className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none transition"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>
      {phase === "idle" ? (
        <button
          type="submit"
          className="rounded-lg px-4 py-2 font-mono text-sm font-bold transition active:scale-[0.97]"
          style={{ background: "var(--color-pass)", color: "#000" }}
        >
          Scan
        </button>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 font-mono text-sm transition"
          style={{
            borderColor: "var(--color-fail)",
            color: "var(--color-fail)",
          }}
        >
          Cancel
        </button>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--color-fail)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Rewrite Stepper.tsx → mini inline**

```tsx
interface StepState {
  label: string;
  state: "upcoming" | "current" | "done";
}
interface Props {
  steps: StepState[];
}

export function Stepper({ steps }: Props) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
      {steps.map((s, i) => (
        <span
          key={s.label}
          style={{
            color:
              s.state === "done"
                ? "var(--color-pass)"
                : s.state === "current"
                  ? "var(--color-text)"
                  : "var(--color-muted)",
          }}
        >
          {i > 0 && (
            <span className="mx-1" style={{ color: "var(--color-muted)" }}>
              →
            </span>
          )}
          {s.label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run`
Expected: clean

- [ ] **Step 5: Commit**

```bash
git add src/components/ForgeHero.tsx src/components/ScanForm.tsx src/components/Stepper.tsx
git commit -m "feat: mini hero, compact scan form, inline stepper"
```

### Task 3: Catalog grid Dashboard + tight ViolationCard + ScoreCard + PRCard

**Files:**

- Modify: `src/components/Dashboard.tsx`, `src/components/ViolationCard.tsx`, `src/components/ScoreCard.tsx`, `src/components/PRCard.tsx`

- [ ] **Step 1: Rewrite Dashboard.tsx → catalog grid**

```tsx
"use client";
import type { ScanResult, FixPR } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { ViolationCard } from "./ViolationCard";
import { PRCard } from "./PRCard";
import { Tabs } from "./Tabs";
import { Card } from "./Card";

type Tab = "violations" | "reader" | "diff";
interface Props {
  result: ScanResult | null;
  phase: string;
  prs: FixPR[];
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function Dashboard({
  result,
  prs,
  activeTab,
  onTabChange,
  download,
}: Props) {
  if (!result) return null;
  return (
    <div>
      {result && <ScoreCard score={result.score} download={download} />}
      <Tabs active={activeTab} onChange={onTabChange} />
      {activeTab === "violations" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.violations.map((v, i) => (
            <ViolationCard key={`${v.file}-${v.line}-${i}`} violation={v} />
          ))}
        </div>
      )}
      {activeTab === "reader" && result.screenReader && (
        <Card className="mt-4">
          <pre
            className="font-mono text-xs whitespace-pre-wrap"
            style={{ color: "var(--color-muted)" }}
          >
            {result.screenReader}
          </pre>
        </Card>
      )}
      {activeTab === "diff" && prs.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prs.map((pr) => (
            <PRCard key={pr.url} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ViolationCard.tsx → tight card**

```tsx
import type { Violation } from "@/lib/types";
import { Card } from "./Card";

interface Props {
  violation: Violation;
}

export function ViolationCard({ violation }: Props) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        <span
          className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: "var(--color-fail)" }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 font-mono text-[10px]"
            style={{ color: "var(--color-muted)" }}
          >
            <span>
              {violation.file}:{violation.line}
            </span>
          </div>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {violation.description}
          </p>
          {violation.snippet && (
            <pre
              className="mt-1 overflow-x-auto rounded bg-[var(--color-ink)] p-2 font-mono text-[10px]"
              style={{ color: "var(--color-muted)" }}
            >
              {violation.snippet}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Rewrite ScoreCard.tsx → reduced full-width**

```tsx
import { Card } from "./Card";

interface Props {
  score: { score: number; grade: string };
  download: (k: "report" | "badge" | "pdf") => void;
}

export function ScoreCard({ score, download }: Props) {
  return (
    <Card className="mb-4 flex items-center gap-4" hover={false}>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold font-display"
        style={{
          border: "2px solid var(--color-pass)",
          color: "var(--color-pass)",
        }}
      >
        {score.grade}
      </div>
      <div className="flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Score: {score.score}/100
        </p>
      </div>
      <div className="flex gap-2">
        {(["report", "badge", "pdf"] as const).map((k) => (
          <button
            key={k}
            onClick={() => download(k)}
            className="rounded px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:brightness-125"
            style={{
              background: "var(--color-pass-bg)",
              color: "var(--color-pass)",
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Rewrite PRCard.tsx → restyled**

```tsx
import type { FixPR } from "@/lib/types";
import { Card } from "./Card";

interface Props {
  pr: FixPR;
}

export function PRCard({ pr }: Props) {
  return (
    <Card>
      <a
        href={pr.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block font-mono text-sm"
        style={{ color: "var(--color-pass)" }}
      >
        #{pr.number}
      </a>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
        {pr.fixCount} fixes
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
        {pr.category}
      </p>
    </Card>
  );
}
```

- [ ] **Step 5: Verify**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run`
Expected: clean

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard.tsx src/components/ViolationCard.tsx src/components/ScoreCard.tsx src/components/PRCard.tsx
git commit -m "feat: catalog-grid dashboard + tight cards"
```

### Task 4: page.tsx layout restructure + remaining component restyles

**Files:**

- Modify: `src/app/page.tsx`, `src/components/Nav.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/Tabs.tsx`

- [ ] **Step 1: Restructure page.tsx**

Mini hero at top. Filter bar above grid. Stepper inline. Dashboard = catalog grid.

```tsx
// top of file — keep existing imports except remove dynamic/HeroScene
import { useState, useRef, useEffect, FormEvent } from "react";
import type { ScanResult, FixPR } from "@/lib/types";
import { ErrorBanner, ActivityLog, ScanSkeleton } from "@/components/states";
import { Stepper, type StepState } from "@/components/Stepper";
import { Nav } from "@/components/Nav";
import { ForgeHero } from "@/components/ForgeHero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { DocsPage } from "@/components/DocsPage";
import { Dashboard } from "@/components/Dashboard";
import { ScanForm } from "@/components/ScanForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FilterBar } from "@/components/FilterBar";
import { runWorkflow } from "@/lib/workflow";

type Tab = "violations" | "reader" | "diff";
type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [prs, setPrs] = useState<FixPR[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("violations");
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("forge");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterTag, setFilterTag] = useState("all");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

  // keep existing useKeyboard, handleScan, handleConfirmScan, handleCancel, addLog, download, useEffect for redirect

  const steps: { label: string; state: StepState }[] = [
    {
      label: "Scan",
      state:
        phase === "idle"
          ? "upcoming"
          : phase === "scanning"
            ? "current"
            : "done",
    },
    {
      label: "Prioritize",
      state:
        phase === "scanning" || phase === "idle"
          ? "upcoming"
          : phase === "prioritizing"
            ? "current"
            : "done",
    },
    {
      label: "Fix & PR",
      state:
        phase === "fixing" ? "current" : phase === "done" ? "done" : "upcoming",
    },
  ];

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        background: "var(--color-canvas)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Nav activeView={activeView} onViewChange={setActiveView} />
      <main
        id="main-content"
        className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6"
      >
        {activeView === "forge" && (
          <section id="forge">
            <h1
              className="font-display text-3xl font-bold leading-tight sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Paste a repo.{" "}
              <span style={{ color: "var(--color-pass)" }}>
                equity ships the fixes.
              </span>
            </h1>
            <p
              className="mt-2 max-w-lg text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              equity checks every file for WCAG violations and opens pull
              requests with fixes.
            </p>
            <div className="mt-4">
              <ScanForm
                repoUrl={repoUrl}
                onUrlChange={setRepoUrl}
                onSubmit={handleScan}
                onCancel={handleCancel}
                phase={phase}
                error={error}
                inputRef={inputRef}
              />
            </div>
            {phase !== "idle" && phase !== "done" && <Stepper steps={steps} />}
            <ForgeHero />
            <Dashboard
              result={result}
              phase={phase}
              prs={prs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              download={download}
            />
            <ActivityLog log={log} />
          </section>
        )}
        {activeView === "guide" && <HowItWorksSection />}
        {activeView === "docs" && <DocsPage />}
      </main>
      <ConfirmDialog
        repoUrl={repoUrl}
        groupCount={prs.length}
        open={confirmOpen}
        onConfirm={handleConfirmScan}
        onCancel={() => setConfirmOpen(false)}
      />
      {error && <ErrorBanner message={error} />}
    </div>
  );
}
```

- [ ] **Step 2: Update Nav.tsx** — token references only (color vars changed, no structural change). Verify text uses `var(--color-muted)` etc.

- [ ] **Step 3: Update ConfirmDialog.tsx** — color tokens, keep functionality.

- [ ] **Step 4: Update Tabs.tsx** — token swap. Use `var(--color-pass)` for active underline.

- [ ] **Step 5: Verify**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run`
Expected: clean

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/Nav.tsx src/components/ConfirmDialog.tsx src/components/Tabs.tsx
git commit -m "feat: page layout restructure, nav/dialog/tabs restyle"
```

### Task 5: DESIGN.md rewrite + build verification

**Files:**

- Modify: `DESIGN.md`

- [ ] **Step 1: Rewrite DESIGN.md**

Complete replacement with catalog-grid design language. See spec doc. Key sections: palette (`#121212`, `#1e1e1e`, amber `#ffb700`), typography (Syne, DM Sans, JetBrains Mono), components (Card, FilterBar, ViolationCard, ScoreCard, PRCard, ForgeHero mini, Nav pill, Stepper mini, Tabs, ConfirmDialog), anti-patterns removed (3D, film grain, mesh orbs, double-bezel, bento grid).

- [ ] **Step 2: Full verification**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit && npx vitest run && npm run build 2>&1 | tail -15`
Expected: tsc clean, 121+ tests pass, build exit 0.

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md
git commit -m "docs: DESIGN.md rewrite for catalog-grid system"
```
