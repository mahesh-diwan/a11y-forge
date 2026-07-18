"use client";

import { useState, useMemo } from "react";

const SAMPLE = `<img src="/hero.png" />
<button onclick="buy()">Buy</button>
<input type="email" />`;

type Edit = { line: string; kind: "add" | "remove" };

const RULES: { test: RegExp; apply: (m: string) => string }[] = [
  {
    test: /<img[^>]*>/gi,
    apply: (m) =>
      m.replace(/<img([^>]*?)\s*\/?>/i, '<img$1 alt="descriptive image">'),
  },
  {
    test: /<button[^>]*>/gi,
    apply: (m) =>
      m.replace(/<button([^>]*?)>/i, '<button$1 aria-label="action">'),
  },
  {
    test: /<(input|select|textarea)[^>]*>/gi,
    apply: (m) =>
      m.replace(
        /<(input|select|textarea)([^>]*?)>/i,
        '<$1$2 aria-label="field">',
      ),
  },
  {
    test: /<html(?![^>]*\slang=)/i,
    apply: (m) => m.replace(/<html/i, '<html lang="en"'),
  },
];

function forge(src: string): { out: string; count: number } {
  let out = src;
  let count = 0;
  for (const r of RULES) {
    out = out.replace(r.test, (m) => {
      count++;
      return r.apply(m);
    });
  }
  return { out, count };
}

export function ForgeHero() {
  const [src, setSrc] = useState(SAMPLE);
  const { count } = useMemo(() => forge(src), [src]);
  return (
    <div
      className="mb-6 rounded-lg border p-4"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 font-bold"
          style={{ color: "var(--color-pass)" }}
        >
          $
        </span>
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          spellCheck={false}
          aria-label="Paste HTML markup"
          className="w-full resize-none bg-transparent font-mono text-xs outline-none"
          rows={2}
        />
        <span
          className="shrink-0 text-[10px] font-mono"
          style={{
            color: count > 0 ? "var(--color-pass)" : "var(--color-muted)",
          }}
        >
          {count > 0 ? `${count} fix${count > 1 ? "es" : ""}` : "clean"}
        </span>
      </div>
    </div>
  );
}
