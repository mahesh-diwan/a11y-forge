import type { FixPR } from "@/lib/types";
import { Card } from "./Card";

interface PRCardProps {
  pr: FixPR;
}

export function PRCard({ pr }: PRCardProps) {
  return (
    <Card>
      <a
        href={pr.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block font-mono text-sm"
        style={{ color: "var(--color-pass)" }}
      >
        #{pr.number}
      </a>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
        {pr.fixCount} fixes
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
        {pr.category}
      </p>
    </Card>
  );
}
