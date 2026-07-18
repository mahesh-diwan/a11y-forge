"use client";
import type { ScanResult, FixPR } from "@/lib/types";
import { ScoreCard } from "./ScoreCard";
import { ViolationCard } from "./ViolationCard";
import { PRCard } from "./PRCard";
import { Tabs } from "./Tabs";
import { Card } from "./Card";

type Tab = "violations" | "reader" | "diff";

interface DashboardProps {
  result: ScanResult | null;
  phase: string;
  prs: FixPR[];
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function Dashboard({
  result,
  phase,
  prs,
  activeTab,
  onTabChange,
  download,
}: DashboardProps) {
  if (!result) return null;
  return (
    <div>
      {result.score && <ScoreCard score={result.score} download={download} />}
      <Tabs<Tab>
        tabs={["violations", "reader", "diff"] as const}
        active={activeTab}
        onChange={onTabChange}
        renderLabel={(t) =>
          t === "violations"
            ? `Issues (${result.violations.length})`
            : t === "reader"
              ? "Screen Reader"
              : "Diff / PR"
        }
      />
      {activeTab === "violations" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.violations.map((v, i) => (
            <ViolationCard key={`${v.file}-${v.line}-${i}`} v={v} />
          ))}
        </div>
      )}
      {activeTab === "reader" && result.screenReader && result.screenReader.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.screenReader.map((sr, i) => (
            <Card key={i}>
              <p className="font-mono text-xs" style={{ color: "var(--color-pass)" }}>
                {sr.element}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                {sr.current} → {sr.fixed}
              </p>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "diff" && prs.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prs.map((pr) => (
            <PRCard key={pr.url} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}
