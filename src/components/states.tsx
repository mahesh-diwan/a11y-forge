import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <section className="text-center py-12 px-6 border border-dashed border-[var(--color-border)] rounded-2xl">
      <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>{title}</p>
      {hint && <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{hint}</p>}
    </section>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <Alert tone="error" title="Something went wrong">{message}</Alert>;
}

export function ActivityLog({ log }: { log: string[] }) {
  if (log.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>Activity Log</h3>
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1" aria-live="polite" aria-label="Activity log">
        {log.map((entry, i) => (
          <div key={i} style={{ color: "var(--color-muted)" }}>{entry}</div>
        ))}
      </div>
    </section>
  );
}

export function ScanSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Scanning">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
