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
