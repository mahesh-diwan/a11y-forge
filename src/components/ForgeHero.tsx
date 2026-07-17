"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const HeroScene = dynamic(() => import("@/components/HeroScene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

const SAMPLE = `<img src="/hero.png" />
<button onclick="buy()">Buy</button>
<input type="email" />
<html>`;

type Edit = { line: string; kind: "add" | "remove" };

const RULES: { test: RegExp; apply: (m: string) => string; label: string }[] = [
  {
    label: "alt text",
    test: /<img([^>]*?)(?<!\balt\s*=\s*["'][^"']*["'])>/gi,
    apply: (m) => m.replace(/<img([^>]*?)\s*\/?>/i, '<img$1 alt="descriptive image">'),
  },
  {
    label: "aria-label",
    test: /<button([^>]*?)(?<!\baria-label\s*=\s*["'][^"']*["'])>/gi,
    apply: (m) => m.replace(/<button([^>]*?)>/i, '<button$1 aria-label="action">'),
  },
  {
    label: "form label",
    test: /<(input|select|textarea)([^>]*?)(?<!\baria-label\s*=\s*["'][^"']*["'])>/gi,
    apply: (m) => m.replace(/<(input|select|textarea)([^>]*?)>/i, '<$1$2 aria-label="field">'),
  },
  {
    label: "html lang",
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

function Prompt() {
  return (
    <span
      className="shrink-0 font-bold"
      style={{
        color: "var(--color-amber)",
        textShadow: "0 0 12px color-mix(in srgb, var(--color-amber) 55%, transparent)",
      }}
    >
      $
    </span>
  );
}

export function ForgeHero() {
  const [prefersReduced, setPrefersReduced] = useState(true);
  const [src, setSrc] = useState(SAMPLE);

  useEffect(() => {
    setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const { out, count } = useMemo(() => forge(src), [src]);
  const edits: Edit[] = useMemo(() => {
    const a = src.split("\n");
    const b = out.split("\n");
    const res: Edit[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        if (a[i] !== undefined) res.push({ line: a[i], kind: "remove" });
        if (b[i] !== undefined) res.push({ line: b[i], kind: "add" });
      }
    }
    return res;
  }, [src, out]);

  return (
    <div
      className="bezel relative overflow-hidden"
      aria-label="Live a11y equity terminal"
      style={{ boxShadow: "0 0 60px -20px color-mix(in srgb, var(--color-amber) 35%, transparent)" }}
    >
      {!prefersReduced && (
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <HeroScene />
        </div>
      )}
      <div className="bezel-core flex h-full min-h-[320px] flex-col sm:min-h-[400px]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background: "var(--color-amber)",
              boxShadow: "0 0 10px color-mix(in srgb, var(--color-amber) 70%, transparent)",
            }}
          />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--color-text)" }}>
            equity
          </span>
          <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--color-muted)" }}>
            a11y terminal
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 font-mono text-xs leading-relaxed sm:text-[13px]">
          <p className="font-mono text-[10px]" style={{ color: "var(--color-amber)" }}>
            Illustrative demo — real scans use equity's detection engine.
          </p>
          <div className="flex items-start gap-2">
            <Prompt />
            <textarea
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              spellCheck={false}
              aria-label="Paste HTML markup"
              className="w-full resize-none bg-transparent outline-none focus:outline-none"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <Prompt />
            <span style={{ color: "var(--color-muted)" }}>equity --fix</span>
          </div>

          <div className="flex-1 overflow-auto" aria-live="polite">
            {edits.length === 0 ? (
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                no fixes needed
              </span>
            ) : (
              edits.map((e, i) => (
                <div
                  key={i}
                  className="overflow-x-auto whitespace-pre-wrap py-[1px]"
                  style={{ color: e.kind === "remove" ? "var(--color-fail)" : "var(--color-pass)" }}
                >
                  {e.kind === "remove" ? (
                    <span style={{ color: "var(--color-fail)" }}> - {e.line}</span>
                  ) : (
                    <span style={{ color: "var(--color-pass)" }}> + {e.line}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-[10px]" style={{ color: "var(--color-muted)" }}>
            <span>equity // live diff</span>
            <span style={{ color: count > 0 ? "var(--color-amber)" : "var(--color-muted)" }}>
              {count > 0 ? `${count} fix${count > 1 ? "es" : ""} applied` : "all clean"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
