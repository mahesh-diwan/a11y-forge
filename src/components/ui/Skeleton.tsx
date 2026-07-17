import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]", className)}
      aria-hidden="true"
    />
  );
}
