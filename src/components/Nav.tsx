"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const LINKS = ["Scan", "Results", "Guide", "API"];

const VIEW_ID: Record<string, string> = { Scan: "forge", Results: "dashboard", API: "docs" };
function viewId(label: string) {
  return VIEW_ID[label] ?? label.toLowerCase().replace(/\s+/g, "-");
}

interface NavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Nav({ activeView, onViewChange }: NavProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleClick(label: string) {
    onViewChange(viewId(label));
    setOpen(false);
  }

  return (
    <>
      <header className={cn("fixed left-1/2 top-6 z-40 w-full max-w-[520px] -translate-x-1/2 px-4 transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none", mounted ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")}>
        <nav
          className="mx-auto flex w-max items-center gap-3 rounded-full border border-[var(--color-border)] px-2 py-1.5 transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ background: "var(--color-surface)" }}
          role="navigation"
          aria-label="Primary"
        >
          <div className="flex items-center gap-2 pl-1">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ background: "var(--color-pass)" }} aria-hidden />
            <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-pass)" }}>
              eq
            </span>
          </div>

          <div className="mx-1 h-3 w-px" style={{ background: "var(--color-border)" }} aria-hidden />

          <ul className="hidden items-center gap-0 flex-1 sm:flex">
            {LINKS.map((l) => (
              <li key={l}>
                <a
                  href={`#${viewId(l)}`}
                  onClick={(e) => { e.preventDefault(); handleClick(l); }}
                  className="rounded px-3 py-1 font-mono text-[11px] transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[var(--color-text)]"
                  style={{
                    color: activeView === viewId(l) ? "var(--color-text)" : "var(--color-muted)",
                    background: activeView === viewId(l) ? "rgba(255,255,255,0.04)" : undefined,
                  }}
                  aria-current={activeView === viewId(l) ? "page" : undefined}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls="nav-overlay"
            className="relative ml-auto flex h-7 w-7 items-center justify-center rounded transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.06] sm:hidden"
            style={{ color: "var(--color-muted)" }}
          >
            <span className={cn("absolute h-px w-3 bg-current transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]", open ? "rotate-45" : "-translate-y-1")} />
            <span className={cn("absolute h-px w-3 bg-current transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)", open ? "-rotate-45" : "translate-y-1")} />
          </button>
        </nav>
      </header>

      <div
        id="nav-overlay"
        role="menu"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[var(--color-ink)]/90 backdrop-blur-3xl transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 invisible"
        )}
      >
        {LINKS.map((l, i) => (
          <a
            key={l}
            href={`#${viewId(l)}`}
            role="menuitem"
            onClick={(e) => { e.preventDefault(); handleClick(l); }}
            className={cn(
              "font-mono text-3xl font-bold transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[var(--color-pass)]",
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
              activeView === viewId(l) ? "text-[var(--color-pass)]" : "text-[var(--color-text)]"
            )}
            style={{ transitionDelay: open ? `${120 + i * 100}ms` : "0ms" }}
          >
            {l}
          </a>
        ))}
      </div>
    </>
  );
}
