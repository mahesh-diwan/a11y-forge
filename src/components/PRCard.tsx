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
          #{pr.number}
        </a>
      ) : (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>dry run</span>
      )}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>
        {pr.fixCount} {pr.fixCount === 1 ? "fix" : "fixes"}
        {pr.dryRun && " · dry run"}
      </p>
      {pr.url && (
        <div style={{ marginTop: "8px" }}>
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            View PR →
          </a>
        </div>
      )}
    </div>
  );
}
