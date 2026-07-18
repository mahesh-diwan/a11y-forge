import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-[var(--surface)] border border-[var(--border)]", className)}
      aria-hidden="true"
    />
  );
}
