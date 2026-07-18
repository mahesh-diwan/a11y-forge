"use client";

const TAGS = [
  "all",
  "missing-alt-text",
  "aria-label",
  "contrast",
  "keyboard",
  "headings",
  "links",
];

interface FilterBarProps {
  active: string;
  onChange: (tag: string) => void;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div
      className="overflow-x-auto"
      role="tablist"
      aria-label="Filter violations"
    >
      <div className="flex gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            role="tab"
            aria-selected={active === tag}
            onClick={() => onChange(tag)}
            className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition"
            style={{
              background:
                active === tag
                  ? "var(--color-pass-bg)"
                  : "var(--color-surface)",
              color:
                active === tag ? "var(--color-pass)" : "var(--color-muted)",
              border: "1px solid",
              borderColor:
                active === tag ? "var(--color-pass)" : "var(--color-border)",
            }}
          >
            {tag.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
