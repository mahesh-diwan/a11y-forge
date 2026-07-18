"use client";

interface TabsProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  renderLabel: (t: T) => string;
  baseId?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, renderLabel, baseId = "tab" }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label="Content tabs" style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          id={`${baseId}-${t}`}
          aria-selected={active === t}
          aria-controls={`${baseId}-panel-${t}`}
          onClick={() => onChange(t)}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            background: "transparent",
            border: "none",
            borderBottom: active === t ? "2px solid var(--accent)" : "2px solid transparent",
            color: active === t ? "var(--text)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          {renderLabel(t)}
        </button>
      ))}
    </div>
  );
}
