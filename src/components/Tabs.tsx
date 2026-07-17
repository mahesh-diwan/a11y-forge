"use client";

import { useCallback, type ReactNode } from "react";

export function Tabs<T extends string>({ tabs, active, onChange, renderLabel }: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  renderLabel: (t: T) => ReactNode;
}) {
  const onKeyDown = useCallback((e: React.KeyboardEvent, tab: T) => {
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(tabs[(idx - 1 + tabs.length) % tabs.length]);
    }
  }, [tabs, onChange]);

  return (
    <div className="flex gap-1 mb-4 border-b border-[var(--color-border)]" role="tablist" aria-orientation="horizontal">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${tab}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(e) => onKeyDown(e, tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              selected ? "border-[var(--color-pass)] v-badge-pass" : "border-transparent hover:text-[var(--color-text)]"
            }`}
            style={selected ? undefined : { color: "var(--color-muted)" }}
          >
            {renderLabel(tab)}
          </button>
        );
      })}
    </div>
  );
}
