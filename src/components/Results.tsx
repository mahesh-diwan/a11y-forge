"use client";

import type { ScanResult, FixPR } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { ViolationCard } from "./ViolationCard";
import { PRCard } from "./PRCard";
import { Tabs } from "./Tabs";

type Tab = "violations" | "reader" | "diff";

interface ResultsProps {
  result: ScanResult | null;
  prs: FixPR[];
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function Results({ result, prs, activeTab, onTabChange, download }: ResultsProps) {
  if (!result) return null;

  return (
    <section id="results" style={{ padding: "48px 0", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px 0" }}>
        RESULTS
      </h2>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />

      {result.score && <ScoreCard score={result.score} download={download} />}

      <Tabs<Tab>
        tabs={["violations", "reader", "diff"] as const}
        active={activeTab}
        onChange={onTabChange}
        renderLabel={(t) =>
          t === "violations" ? `Issues (${result.violations.length})` : t === "reader" ? "Screen Reader" : "Diff / PR"
        }
      />

      {activeTab === "violations" && (
        <div role="tabpanel" id="tab-panel-violations" aria-labelledby="tab-violations" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {result.violations.map((v, i) => (
            <ViolationCard key={`${v.file}-${v.line}-${i}`} v={v} />
          ))}
        </div>
      )}

      {activeTab === "reader" && result.screenReader && result.screenReader.length > 0 && (
        <div role="tabpanel" id="tab-panel-reader" aria-labelledby="tab-reader" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {result.screenReader.map((sr, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", padding: "12px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", margin: "0 0 4px 0" }}>
                {sr.element}
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", margin: 0 }}>
                {sr.current} → {sr.fixed}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "diff" && prs.length > 0 && (
        <div role="tabpanel" id="tab-panel-diff" aria-labelledby="tab-diff" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px" }}>
          {prs.map((pr) => (
            <PRCard key={pr.url || pr.category} pr={pr} />
          ))}
        </div>
      )}
      {activeTab === "diff" && prs.length === 0 && (
        <div role="tabpanel" id="tab-panel-diff" aria-labelledby="tab-diff" style={{ border: "1px solid var(--border)", padding: "16px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            No pull requests generated yet.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", margin: "8px 0 0 0", lineHeight: 1.6 }}>
            PR generation requires OpenAI API key. If key is missing or quota exhausted, PRs are skipped. Check <code style={{ background: "var(--surface)", padding: "1px 4px" }}>OPENAI_API_KEY</code> env var in Vercel dashboard.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", margin: "8px 0 0 0", lineHeight: 1.6 }}>
            Try demo to see example PRs.
          </p>
        </div>
      )}
    </section>
  );
}
