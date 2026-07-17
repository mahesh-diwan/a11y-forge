import type { Violation, ConfidenceResult } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { metaFor } from "@/lib/violation-meta";

export function ViolationCard({ v, conf }: { v: Violation; conf?: ConfidenceResult }) {
  const m = metaFor(v.type);
  const confClass = conf
    ? conf.confidence >= 90 ? "v-badge-pass" : conf.confidence >= 70 ? "v-badge-warn" : "v-badge-fail"
    : "";
  return (
    <div className="bezel" style={{ borderColor: "var(--color-border)" }}>
      <div className="bezel-core p-4">
        <div className="flex items-start justify-between mb-1 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge severity={m.severity}>{m.displayName}</Badge>
            {conf && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border border-[var(--color-border)] ${confClass}`}>
                {conf.confidence}% confident
              </span>
            )}
          </div>
          <span className="text-xs font-mono shrink-0" style={{ color: "var(--color-muted)" }}>{v.file}:{v.line}</span>
        </div>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>{v.description}</p>
        {conf?.reasoning && (
          <p className="text-[11px] mt-1 italic" style={{ color: "var(--color-muted)" }}>{conf.reasoning}</p>
        )}
        {v.snippet && (
          <pre className="mt-2 rounded border border-[var(--color-border)] bg-[var(--color-ink)] p-3 text-xs font-mono overflow-x-auto" style={{ color: "var(--color-text)" }}>
            {v.snippet}
          </pre>
        )}
      </div>
    </div>
  );
}
