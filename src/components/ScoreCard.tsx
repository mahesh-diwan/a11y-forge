"use client";

import type { ScoreResult } from "@/lib/types";

interface ScoreCardProps {
  score: ScoreResult;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function ScoreCard({ score, download }: ScoreCardProps) {
  const isPass = score.score >= 70;
  const gradeColor = isPass ? "var(--accent)" : "var(--fail)";

  return (
    <div style={{ border: "1px solid var(--border)", padding: "20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: `2px solid ${gradeColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "24px",
            fontWeight: 700,
            color: gradeColor,
            flexShrink: 0,
          }}
        >
          {score.grade}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, margin: 0, color: gradeColor }}>
            {score.score}/100
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", margin: "4px 0 0 0" }}>
            {score.totalViolations} violations · {score.affectedFiles.length} files
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {(["report", "badge", "pdf"] as const).map((k) => (
            <button
              key={k}
              onClick={() => download(k)}
              aria-label={k === "report" ? "Download HTML report" : k === "badge" ? "Download badge SVG" : "Download PDF report"}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              {k === "report" ? "HTML Report" : k === "badge" ? "Badge SVG" : "PDF Report"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
