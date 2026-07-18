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
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0, display: "inline-block" }} role="img" aria-label={`Severity: ${v.type}`} />
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
