import type { ScoreResult } from "@/lib/types";
import { Card } from "./Card";

interface ScoreCardProps {
  score: ScoreResult;
  download: (k: "report" | "badge" | "pdf") => void;
}

export function ScoreCard({ score, download }: ScoreCardProps) {
  return (
    <Card className="mb-4 flex items-center gap-4" hover={false}>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold font-display"
        style={{
          border: "2px solid var(--color-pass)",
          color: "var(--color-pass)",
        }}
      >
        {score.grade}
      </div>
      <div className="flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Score: {score.score}/100
        </p>
      </div>
      <div className="flex gap-2">
        {(["report", "badge", "pdf"] as const).map((k) => (
          <button
            key={k}
            onClick={() => download(k)}
            className="rounded px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:brightness-125"
            style={{
              background: "var(--color-pass-bg)",
              color: "var(--color-pass)",
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </Card>
  );
}
