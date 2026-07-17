import { cn } from "@/lib/cn";

export type StepState = "done" | "current" | "upcoming" | "error";

const DOT: Record<StepState, string> = {
  done: "bg-[var(--color-pass)] text-[var(--color-ink)] border border-[var(--color-pass)]",
  current: "bg-[var(--color-pass)] text-[var(--color-ink)] border-2 border-[var(--color-pass)] shadow-[0_0_0_4px_rgba(255,183,0,0.15)]",
  upcoming: "bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]",
  error: "bg-[var(--color-fail)] text-[var(--color-ink)] border border-[var(--color-fail)]",
};

const LINE: Record<StepState, string> = {
  done: "bg-[var(--color-pass)]",
  current: "bg-[var(--color-border)]",
  upcoming: "bg-[var(--color-border)]",
  error: "bg-[var(--color-fail)]",
};

export function Stepper({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <nav aria-label="Scan progress" className="flex items-center w-full flex-wrap gap-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 min-w-[140px] last:flex-none">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold font-display",
              DOT[step.state]
            )}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            {step.state === "done" ? "✓" : step.state === "error" ? "!" : i + 1}
          </div>
          <span
            className={cn(
              "ml-2 text-xs hidden sm:block font-mono uppercase tracking-wide",
              step.state === "current" || step.state === "done" ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"
            )}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-3", LINE[step.state])} />
          )}
        </div>
      ))}
    </nav>
  );
}
