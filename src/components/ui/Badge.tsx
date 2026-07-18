import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Severity = "critical" | "serious" | "moderate" | "pass" | "neutral";

const STYLES: Record<Severity, string> = {
  critical: "border-[var(--fail)]/40 text-[var(--fail)] bg-[var(--fail)]/10",
  serious: "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10",
  moderate: "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10",
  pass: "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10",
  neutral: "border-[var(--border)] text-[var(--muted)]",
};

export function Badge({ severity = "neutral", children, className }: {
  severity?: Severity;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-medium",
        STYLES[severity],
        className
      )}
    >
      {children}
    </span>
  );
}
