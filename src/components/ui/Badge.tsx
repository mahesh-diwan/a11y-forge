import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Severity = "critical" | "serious" | "moderate" | "pass" | "neutral";

const STYLES: Record<Severity, string> = {
  critical: "border-[var(--color-fail)]/40 text-[var(--color-fail)] bg-[var(--color-fail)]/10",
  serious: "border-[var(--color-warn)]/40 text-[var(--color-warn)] bg-[var(--color-warn)]/10",
  moderate: "border-[var(--color-focus)]/40 text-[var(--color-focus)] bg-[var(--color-focus)]/10",
  pass: "border-[var(--color-pass)]/40 text-[var(--color-pass)] bg-[var(--color-pass)]/10",
  neutral: "border-[var(--color-border)] text-[var(--color-muted)]",
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[severity],
        className
      )}
    >
      {children}
    </span>
  );
}
