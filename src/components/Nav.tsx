"use client";

interface NavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const LINKS = ["Scan", "Results", "Guide", "Docs"];

export function Nav({ activeView, onViewChange }: NavProps) {
  function handleClick(label: string) {
    const id = label.toLowerCase();
    onViewChange(id);
    const el = document.getElementById(id);
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
        <ul style={{ display: "flex", gap: "4px", listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
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
