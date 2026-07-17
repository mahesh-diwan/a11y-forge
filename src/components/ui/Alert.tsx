import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "error" | "warning" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "border-[var(--color-fail)]/40 bg-[var(--color-fail)]/10 text-[var(--color-fail)]",
  warning: "border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 text-[var(--color-warn)]",
  success: "border-[var(--color-pass)]/40 bg-[var(--color-pass)]/10 text-[var(--color-pass)]",
  info: "border-[var(--color-focus)]/40 bg-[var(--color-focus)]/10 text-[var(--color-focus)]",
};

export function Alert({ tone = "info", title, children }: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={cn("rounded-xl border p-4 text-sm", TONES[tone])}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-[13px] opacity-90">{children}</div>
    </div>
  );
}
