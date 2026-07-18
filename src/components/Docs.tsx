import { PipelineDiagram, SequenceDiagram } from "@/components/Diagrams";

const ROUTES = [
  { method: "POST", path: "/api/scan", desc: "Walk repo tree, download up to 150 files, run all WCAG checks." },
  { method: "POST", path: "/api/prioritize", desc: "Group violations by category, rank by impact. Requires consentToAi." },
  { method: "POST", path: "/api/pr", desc: "Generate diffs, commit, open PR. dryRun returns diffs only." },
  { method: "POST", path: "/api/report", desc: "Render HTML report. Returns text/html attachment." },
  { method: "POST", path: "/api/report/pdf", desc: "Render PDF report via pdf-lib. Requires score." },
  { method: "GET", path: "/api/badge", desc: "SVG score badge. POST with score for custom, GET for default." },
];

const SCANNERS = [
  "scanner.ts (html) — missing-alt-text: images missing alt attribute",
  "scanner.ts (html) — missing-aria-label: buttons without text or aria-label",
  "scanner.ts (html) — missing-form-label: inputs without accessible label",
  "scanner.ts (html) — missing-html-lang: <html> missing lang attribute",
  "contrast.ts — CSS color contrast ratio (4.5:1 AA, 7:1 AAA)",
  "keyboard.ts — keyboard traps, tabindex \u22650, missing escape",
  "headings.ts — heading hierarchy, skips, empty, single h1",
  "links.ts — vague text, empty hrefs, missing names",
  "ast-scanner.ts — Babel JSX/TSX AST walker for iframe title, JSX-specific patterns",
  "screen-reader.ts — simulate SR output before/after per violation",
  "confidence.ts — heuristic detection confidence 0-100%",
  "violation-meta.ts — severity, WCAG ref, fix strategy per type",
];

export function Docs() {
  return (
    <section style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        DOCS
      </h1>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Pipeline
      </h2>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <PipelineDiagram />
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Sequence
      </h2>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <SequenceDiagram />
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Quick Start
      </h2>
      <div style={{ border: "1px solid var(--border)", padding: "16px", marginBottom: "24px" }}>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
{`git clone https://github.com/yourusername/a11y-forge
cd a11y-forge
cp .env.local.example .env.local
# Edit .env.local with your keys
npm install
npm run dev`}
        </pre>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "12px 0 0 0" }}>
          Open <strong>http://localhost:3000</strong>, paste a GitHub URL, click Scan.
        </p>
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        API
      </h2>
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

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        API Examples
      </h2>
      <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`# POST /api/scan
curl -X POST https://a11y-forge.vercel.app/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"repoUrl": "https://github.com/owner/repo"}'`}
        </pre>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`# POST /api/prioritize
curl -X POST https://a11y-forge.vercel.app/api/prioritize \\
  -H "Content-Type: application/json" \\
  -d '{"violations": [...], "consentToAi": true}'`}
        </pre>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`# POST /api/pr
curl -X POST https://a11y-forge.vercel.app/api/pr \\
  -H "Content-Type: application/json" \\
  -d '{"repoUrl": "https://github.com/owner/repo", "group": {...}}'`}
        </pre>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`# POST /api/report
curl -X POST https://a11y-forge.vercel.app/api/report \\
  -H "Content-Type: application/json" \\
  -d '{"violations": [...], "score": 42}'`}
        </pre>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`# POST /api/badge (custom)
curl -X POST https://a11y-forge.vercel.app/api/badge \\
  -H "Content-Type: application/json" \\
  -d '{"score": 85}'

# GET /api/badge (default)
curl https://a11y-forge.vercel.app/api/badge`}
        </pre>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "8px 0 0 0" }}>
          Example scan response:
        </p>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8, border: "1px solid var(--border)", padding: "12px" }}>
{`{
  "violations": [
    { "type": "missing-alt-text", "count": 3, "severity": "error" },
    { "type": "missing-form-label", "count": 1, "severity": "error" }
  ],
  "score": 42,
  "screenReader": "4 violations found across 2 categories"
}`}
        </pre>
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Scanners
      </h2>
      <div style={{ display: "grid", gap: "4px", marginBottom: "24px" }}>
        {SCANNERS.map((s) => (
          <div key={s} style={{ border: "1px solid var(--border)", padding: "8px 12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0 }}>{s}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Setup
      </h2>
      <div style={{ border: "1px solid var(--border)", padding: "16px" }}>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
{`GITHUB_TOKEN=ghp_...     # required, repo scope
OPENAI_API_KEY=sk-...    # optional, enables AI grouping

npm install
npm run dev
npm test`}
        </pre>
      </div>

      <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)", margin: "0 0 12px 0" }}>
        Limitations
      </h2>
      <div style={{ border: "1px solid var(--border)", padding: "16px" }}>
        <pre style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
{`\u2022 File limit: 150 files per scan
\u2022 Rate limit: 20 req/min per IP
\u2022 Body limit: 500KB
\u2022 Scope-limited checks \u2014 contrast, keyboard traps are heuristic, no runtime pixel verification
\u2022 Public repos only
\u2022 Static analysis only \u2014 no live browser rendering`}
        </pre>
      </div>
    </section>
  );
}
