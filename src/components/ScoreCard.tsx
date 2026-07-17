import type { ScoreResult } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function ScoreCard({ score, onReport, onBadge }: {
  score: ScoreResult;
  onReport: () => void;
  onBadge: () => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 blur-2xl rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,183,0,0.35) 0%, transparent 70%)" }}
            />
            <div className="bezel" style={{ borderColor: "var(--color-border)" }}>
              <div className="bezel-core flex h-28 w-28 items-center justify-center p-0 sm:h-32 sm:w-32" style={{ background: "var(--color-surface-solid)" }}>
                <span className="font-display text-6xl font-bold leading-none sm:text-7xl" style={{ color: "var(--color-pass)" }}>{score.grade}</span>
              </div>
            </div>
          </div>
          <span className="mt-3 font-mono text-xs" style={{ color: "var(--color-muted)" }}>{score.score}/100</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="mb-1 font-display text-xl font-semibold">
            Accessibility Score: <span style={{ color: "var(--color-pass)" }}>{score.label}</span>
          </h3>
          <p className="mb-3 text-sm" style={{ color: "var(--color-muted)" }}>
            {score.totalViolations} issues across {score.affectedFiles.length} files
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {score.breakdown.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-ink)] px-2 py-0.5 text-[11px]">
                <span className="capitalize" style={{ color: "var(--color-muted)" }}>{b.type.replace(/-/g, " ")}</span>
                <span className="font-mono v-badge-fail">x{b.count}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={onReport}>Download Report</Button>
          <Button variant="secondary" size="sm" onClick={onBadge}>Download Badge</Button>
        </div>
      </div>
    </section>
  );
}
