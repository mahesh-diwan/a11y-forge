import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "error" | "warning" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "border-[var(--fail)]/40 bg-[var(--fail)]/10 text-[var(--fail)]",
  warning: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
  success: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
  info: "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
};

export function Alert({ tone = "info", title, children }: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={cn("border p-4 text-sm", TONES[tone])}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-[13px] opacity-90">{children}</div>
    </div>
  );
}
