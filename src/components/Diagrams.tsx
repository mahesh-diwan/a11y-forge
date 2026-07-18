type Step = { label: string; sub?: string };

const STEPS: Step[] = [
  { label: "Submit URL" },
  { label: "Scan", sub: "AST + crawler" },
  { label: "Prioritize", sub: "AI grouping" },
  { label: "Generate fixes", sub: "AI diffs" },
  { label: "Create PRs", sub: "GitHub API" },
];

function Arrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M5 12h12m-4-4 4 4-4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PipelineDiagram() {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", justifyContent: "center", padding: "8px 0" }}>
      {STEPS.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              border: "1px solid var(--accent)",
              padding: "8px 14px",
              textAlign: "center",
              minWidth: "80px",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", fontWeight: 600, display: "block" }}>
              {s.label}
            </span>
            {s.sub && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                {s.sub}
              </span>
            )}
          </div>
          {i < STEPS.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  );
}

interface SeqRow {
  from: string;
  arrow: "->>" | "-->>";
  to: string;
  label: string;
  selfLoop?: boolean;
}

const SEQ: SeqRow[] = [
  { from: "Client", arrow: "->>", to: "POST /api/scan", label: "{ repoUrl }" },
  { from: "POST /api/scan", arrow: "->>", to: "GitHub API", label: "GET /repos/{o}/{r}/git/trees" },
  { from: "GitHub API", arrow: "-->>", to: "POST /api/scan", label: "file tree" },
  { from: "POST /api/scan", arrow: "->>", to: "GitHub API", label: "GET file contents" },
  { from: "GitHub API", arrow: "-->>", to: "POST /api/scan", label: "source files" },
  { from: "POST /api/scan", arrow: "->>", to: "POST /api/scan", label: "run WCAG checks", selfLoop: true },
  { from: "POST /api/scan", arrow: "-->>", to: "Client", label: "{ violations[], score }" },
  { from: "Client", arrow: "->>", to: "POST /api/prioritize", label: "{ violations[] }" },
  { from: "POST /api/prioritize", arrow: "->>", to: "OpenAI API", label: "group + rank" },
  { from: "OpenAI API", arrow: "-->>", to: "POST /api/prioritize", label: "FixGroup[]" },
  { from: "POST /api/prioritize", arrow: "-->>", to: "Client", label: "{ groups[] }" },
  { from: "Client", arrow: "->>", to: "POST /api/pr", label: "{ repoUrl, group } (loop)" },
  { from: "POST /api/pr", arrow: "->>", to: "OpenAI API", label: "generate diffs" },
  { from: "OpenAI API", arrow: "-->>", to: "POST /api/pr", label: "patched files" },
  { from: "POST /api/pr", arrow: "->>", to: "GitHub API", label: "createBlob + commit + PR" },
  { from: "GitHub API", arrow: "-->>", to: "POST /api/pr", label: "PR url" },
  { from: "POST /api/pr", arrow: "-->>", to: "Client", label: "{ url, number }" },
];

const COLORS = ["var(--accent)", "var(--text)", "var(--muted)"];

export function SequenceDiagram() {
  const participants = [...new Set(SEQ.flatMap((r) => [r.from, r.to]))];
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", overflowX: "auto" }}>
      {participants.map((p, pi) => (
        <div key={p} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px" }}>
          <div
            style={{
              flexShrink: 0,
              width: "140px",
              padding: "4px 8px",
              border: "1px solid var(--border)",
              color: COLORS[pi % 3],
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {p}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
            {SEQ.filter((r) => r.from === p).map((r, ri) => (
              <div key={ri} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0" }}>
                <span style={{ color: "var(--muted)", fontSize: "9px", flexShrink: 0, width: "20px", textAlign: "center" }}>
                  {r.selfLoop ? "↻" : "→"}
                </span>
                <span style={{ color: "var(--accent)", flexShrink: 0, minWidth: "30px" }}>
                  {r.to === r.from ? "" : r.to}
                </span>
                <span style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
