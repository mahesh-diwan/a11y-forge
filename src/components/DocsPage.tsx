"use client";

import { Mermaid } from "./Mermaid";

const TECH_PIPELINE = `flowchart LR
    A["<b>Submit URL</b><br/><span style='font-size:11px'>POST /api/scan</span>"]
    B["<b>Scan sources</b><br/><span style='font-size:11px'>AST + crawler</span>"]
    C["<b>Prioritize</b><br/><span style='font-size:11px'>GPT grouping</span>"]
    D["<b>Generate fixes</b><br/><span style='font-size:11px'>Codex diffs</span>"]
    E["<b>Create PRs</b><br/><span style='font-size:11px'>GitHub API</span>"]

    A --> B --> C --> D --> E

    B -.-> F["<span style='font-size:11px'>contrast.ts</span>"]
    B -.-> G["<span style='font-size:11px'>keyboard.ts</span>"]
    B -.-> H["<span style='font-size:11px'>headings.ts</span>"]
    B -.-> I["<span style='font-size:11px'>links.ts</span>"]

    style A fill:#2a2525,stroke:#9a9897,color:#cfcecd
    style B fill:#2a2525,stroke:#8bc48b,color:#cfcecd
    style C fill:#2a2525,stroke:#f5b544,color:#cfcecd
    style D fill:#2a2525,stroke:#8aa4d6,color:#cfcecd
    style E fill:#2a2525,stroke:#8bc48b,color:#cfcecd
    style F fill:#2a2525,stroke:#656363,color:#9a9897
    style G fill:#2a2525,stroke:#656363,color:#9a9897
    style H fill:#2a2525,stroke:#656363,color:#9a9897
    style I fill:#2a2525,stroke:#656363,color:#9a9897`;

const TECH_SEQUENCE = `sequenceDiagram
    participant C as Client (browser)
    participant S as POST /api/scan
    participant P as POST /api/prioritize
    participant F as POST /api/pr
    participant G as GitHub REST API
    participant O as OpenAI API

    C->>S: { repoUrl }
    S->>G: GET /repos/{owner}/{repo}/git/trees
    G-->>S: file tree
    S->>G: GET file contents (batch 5)
    G-->>S: source files
    S->>S: run checks per file
    S-->>C: { violations[], score, screenReader[] }

    C->>P: { violations[] }
    P->>O: group + rank by impact
    O-->>P: FixGroup[]
    P-->>C: { groups[] }

    loop each FixGroup
        C->>F: { repoUrl, group }
        F->>O: generate diffs
        O-->>F: patched files
        F->>G: createBlob + createTree + createCommit
        F->>G: createRef + createPR
        G-->>F: PR url
        F-->>C: { url, number, fixCount, diffs }
    end`;

const TECH_STATES = `stateDiagram-v2
    [*] --> idle
    idle --> scanning: submit URL
    scanning --> prioritizing: scan complete
    prioritizing --> fixing: groups ready
    fixing --> done: all PRs created
    done --> idle: reset
    scanning --> idle: abort / error
    prioritizing --> idle: abort / error
    fixing --> idle: abort / error`;

const ROUTES = [
  {
    method: "POST",
    path: "/api/scan",
    desc: "Walk repo tree via Git Data API, download up to 100 source files, run all WCAG checks.",
    request: `{ "repoUrl": string }`,
    response: `{ repoUrl, violations[], score, screenReader[], confidence[] }`,
  },
  {
    method: "POST",
    path: "/api/prioritize",
    desc: "Group violations by category and rank by user impact. Requires consentToAi. Falls back to deterministic grouping.",
    request: `{ "violations": Violation[], "consentToAi": true }`,
    response: `{ "groups": FixGroup[] }  // 403 if consentToAi missing`,
  },
  {
    method: "POST",
    path: "/api/pr",
    desc: "Generate diffs, commit to branch a11y-fix-<category>, open PR. dryRun returns diffs without committing.",
    request: `{ "repoUrl": string, "group": FixGroup, "dryRun"?: boolean, "consentToAi": true }`,
    response: `{ category, url?, number?, fixCount?, explanation?, diffs? }`,
  },
  {
    method: "POST",
    path: "/api/report",
    desc: "Render HTML report with score, violations, and screen-reader previews.",
    request: `ScanResult  // any of repoUrl, violations, score, screenReader`,
    response: `text/html  // attachment a11y-report-<ts>.html`,
  },
  {
    method: "POST",
    path: "/api/report/pdf",
    desc: "Render PDF report via pdf-lib. Requires score field in payload.",
    request: `ScanResult  // requires "score": ScoreResult`,
    response: `application/pdf  // attachment a11y-report-<ts>.pdf`,
  },
  {
    method: "POST",
    path: "/api/badge",
    desc: "Render SVG score badge. GET returns default 'Not scanned' badge.",
    request: `{ "score": ScoreResult }`,
    response: `image/svg+xml  // badge`,
  },
];

const SCANNERS = [
  { name: "contrast.ts", desc: "Parse CSS colors, compute relative luminance, WCAG contrast ratio (4.5:1 AA, 3:1 AA large, 7:1 AAA). Handles named colors, rgb(), hex, NaN guard." },
  { name: "keyboard.ts", desc: "Detect keyboard traps (tabindex ≥0, missing escape handlers) and non-interactive focusable elements." },
  { name: "headings.ts", desc: "Validate heading hierarchy — no skips (h1→h3), no empty headings, single h1 per document." },
  { name: "links.ts", desc: "Flag vague link text ('click here', 'read more'), empty hrefs, missing accessible names." },
  { name: "screen-reader.ts", desc: "Simulate screen reader output per element, generate before/after preview strings." },
  { name: "ast-scanner.ts", desc: "Babel AST walker for JSX/TSX — find img without alt, button without aria-label, missing form labels, html without lang." },
  { name: "confidence.ts", desc: "Score detection confidence (0-100%) per violation using heuristic rules. Average across all violations." },
  { name: "violation-meta.ts", desc: "Single source of truth for violation metadata: severity, WCAG ref, human label, fix strategy per violation type." },
];

export function DocsPage() {
  return (
    <section id="docs" className="mt-6 scroll-mt-24">
      <h1 className="sr-only">Technical reference</h1>
      <div className="bezel">
        <div className="bezel-core p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Technical Reference
          </h2>
          <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
            Architecture, API endpoints, scanner modules, and setup reference for developers.
          </p>

          {/* Architecture */}
          <div className="mt-10">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-pass)" }}>Architecture</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bezel">
                <div className="bezel-core p-4">
                  <span className="mb-2 block font-mono text-[10px] font-semibold" style={{ color: "var(--color-text)" }}>pipeline</span>
                  <Mermaid chart={TECH_PIPELINE} />
                </div>
              </div>
              <div className="bezel">
                <div className="bezel-core p-4">
                  <span className="mb-2 block font-mono text-[10px] font-semibold" style={{ color: "var(--color-text)" }}>sequence</span>
                  <Mermaid chart={TECH_SEQUENCE} />
                </div>
              </div>
            </div>
            <div className="mt-6 bezel">
              <div className="bezel-core p-4">
                <span className="mb-2 block font-mono text-[10px] font-semibold" style={{ color: "var(--color-text)" }}>state machine</span>
                <Mermaid chart={TECH_STATES} />
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-12">
            <h3 className="font-display text-lg font-semibold" style={{ color: "#ffb700" }}>How It Works</h3>
            <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
              Four-stage pipeline. Each stage is an independent API route the UI calls in order.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1 · Scan", body: "POST /api/scan walks the repo tree, downloads up to 100 files, runs WCAG checks. Returns violations, score, screen-reader previews, confidence." },
                { step: "2 · Prioritize", body: "POST /api/prioritize groups violations by category and ranks by human impact. Needs consentToAi: true. Deterministic fallback if no OpenAI key." },
                { step: "3 · Fix", body: "POST /api/pr generates diffs, commits to a11y-fix-<category>, opens a PR. dryRun: true returns diffs without committing." },
                { step: "4 · Report", body: "POST /api/report + /api/report/pdf emit HTML/PDF. POST /api/badge (or GET) emits an SVG score badge." },
              ].map((s) => (
                <div key={s.step} className="bezel">
                  <div className="bezel-core p-3">
                    <span className="font-mono text-[11px] font-bold" style={{ color: "#ffb700" }}>{s.step}</span>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Reference */}
          <div className="mt-12">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-warn)" }}>API Reference</h3>
            <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--color-muted)" }}>
              All routes POST unless noted. Rate-limited 20 req/min per IP (429 + Retry-After: 60). Max body 500 KB.
            </p>
            <div className="mt-4 space-y-3">
              {ROUTES.map((r) => (
                <div key={r.path} className="bezel">
                  <div className="bezel-core p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${r.method === "POST" ? "bg-[var(--color-pass)]/15 text-[var(--color-pass)]" : "bg-[var(--color-focus)]/15 text-[var(--color-focus)]"}`}
                      >
                        {r.method}
                      </span>
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text)" }}>{r.path}</span>
                    </div>
                    <p className="mt-2 font-mono text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{r.desc}</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <span className="mb-1 block font-mono text-[10px] font-semibold" style={{ color: "#ffb700" }}>request</span>
                        <pre className="overflow-x-auto rounded bg-[var(--color-ink)] p-2 font-mono text-[10px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{r.request}</pre>
                      </div>
                      <div>
                        <span className="mb-1 block font-mono text-[10px] font-semibold" style={{ color: "#ffb700" }}>response</span>
                        <pre className="overflow-x-auto rounded bg-[var(--color-ink)] p-2 font-mono text-[10px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{r.response}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scanner modules */}
          <div className="mt-12">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-fail)" }}>Scanner Modules</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SCANNERS.map((s) => (
                <div key={s.name} className="bezel">
                  <div className="bezel-core p-3">
                    <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text)" }}>{s.name}</span>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup */}
          <div className="mt-12">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-muted)" }}>Setup</h3>
            <div className="mt-4 bezel">
              <div className="bezel-core space-y-3 p-4 font-mono text-[11px]">
                <div>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>Environment</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-[var(--color-ink)] p-3 text-xs" style={{ color: "var(--color-muted)" }}>{`GITHUB_TOKEN=ghp_...     # repo scope required
OPENAI_API_KEY=sk-...    # optional, enables GPT grouping`}</pre>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>Commands</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-[var(--color-ink)] p-3 text-xs" style={{ color: "var(--color-muted)" }}>{`npm install         # install deps
npm run dev          # start dev server (localhost:3000)
npm test             # 54 tests across 13 files
npm run build        # production build`}</pre>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>Limits</span>
                  <p style={{ color: "var(--color-muted)" }}>Scans up to 100 files per repo, 5 concurrent fetches. Branch order: <span className="font-mono">develop → main → master</span>. Public repos only.</p>
                  <p className="mt-2" style={{ color: "var(--color-muted)" }}>Rate limit: <span className="font-mono">20 req/min per IP</span> (429 + Retry-After: 60). AI routes require <span className="font-mono">consentToAi: true</span> — without it no code is sent to OpenAI (403).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
