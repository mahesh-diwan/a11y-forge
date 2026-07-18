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
  "contrast.ts \u2014 CSS color contrast ratio (4.5:1 AA, 7:1 AAA)",
  "keyboard.ts \u2014 keyboard traps, tabindex \u22650, missing escape",
  "headings.ts \u2014 heading hierarchy, skips, empty, single h1",
  "links.ts \u2014 vague text, empty hrefs, missing names",
  "screen-reader.ts \u2014 simulate SR output before/after",
  "ast-scanner.ts \u2014 Babel JSX/TSX walker for alt, aria-label, form labels",
  "confidence.ts \u2014 heuristic detection confidence 0-100%",
  "violation-meta.ts \u2014 severity, WCAG ref, fix strategy per type",
];

export function Docs() {
  return (
    <section id="docs" style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        DOCS
      </h2>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Pipeline
      </h3>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <Mermaid chart={PIPELINE} />
      </div>

      <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Sequence
      </h3>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <Mermaid chart={SEQUENCE} />
      </div>

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
