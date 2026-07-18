"use client";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 0", marginTop: "48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", fontWeight: 700 }}>af</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>a11y-forge \u00b7 built with Codex + GPT-5.6</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" }}>
          <a href="https://github.com/mahesh-diwan/a11y-forge" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            GitHub
          </a>
          {" \u00b7 "} v0.1.0
        </div>
      </div>
    </footer>
  );
}
