import type { FixPR } from "@/lib/types";

export function PRCard({ pr }: { pr: FixPR }) {
  return (
    <div className={`rounded-xl border p-4 ${pr.error ? "border-[var(--color-fail)]/40" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium font-display">{pr.category}</span>
        {pr.url ? (
          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-xs v-badge-pass hover:underline">View PR →</a>
        ) : (
          <span className="text-xs v-badge-fail">{pr.error}</span>
        )}
      </div>
      {pr.fixCount && (
        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{pr.fixCount} files fixed</p>
      )}
      {pr.explanation && (
        <p className="text-xs mt-2 italic rounded-md bg-[rgba(61,220,132,0.08)] px-3 py-2" style={{ color: "var(--color-muted)" }}>{pr.explanation}</p>
      )}
      {pr.dryRun && (
        <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-warn)" }}>dry-run · no PR created</p>
      )}
    </div>
  );
}
