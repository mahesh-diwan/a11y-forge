export type StepState = "done" | "current" | "upcoming" | "error";

interface Props {
  steps: { label: string; state: StepState }[];
}

export function Stepper({ steps }: Props) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
      {steps.map((s, i) => (
        <span
          key={s.label}
          style={{
            color:
              s.state === "done"
                ? "var(--color-pass)"
                : s.state === "current"
                  ? "var(--color-text)"
                  : s.state === "error"
                    ? "var(--color-fail)"
                    : "var(--color-muted)",
          }}
        >
          {i > 0 && (
            <span className="mx-1" style={{ color: "var(--color-muted)" }}>
              →
            </span>
          )}
          {s.label}
        </span>
      ))}
    </div>
  );
}
