import type { Violation } from "@/lib/types";
import { Card } from "./Card";

interface ViolationCardProps {
  v: Violation;
}

export function ViolationCard({ v }: ViolationCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        <span
          className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: "var(--color-fail)" }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 font-mono text-[10px]"
            style={{ color: "var(--color-muted)" }}
          >
            <span>
              {v.file}:{v.line}
            </span>
          </div>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {v.description}
          </p>
          {v.snippet && (
            <pre
              className="mt-1 overflow-x-auto rounded bg-[var(--color-ink)] p-2 font-mono text-[10px]"
              style={{ color: "var(--color-muted)" }}
            >
              {v.snippet}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}
