"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useResults } from "@/lib/ResultsContext";

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
      {msg}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { result } = useResults();
  const [toast, setToast] = useState<string | null>(null);

  const links = [
    { label: "Home", href: "/" },
    { label: "Results", href: "/results", disabled: !result },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        maxWidth: "560px",
        width: "calc(100% - 32px)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "6px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
        }}
        role="navigation"
        aria-label="Primary"
      >
        <Link
          href="/"
          aria-label="a11y-forge home"
          style={{
            color: "var(--accent)",
            fontWeight: 700,
            marginRight: "12px",
            textDecoration: "none",
          }}
        >
          af
        </Link>
        <div
          style={{
            width: "1px",
            height: "14px",
            background: "var(--border)",
            marginRight: "12px",
          }}
          aria-hidden="true"
        />
        <ul
          style={{
            display: "flex",
            gap: "4px",
            listStyle: "none",
            margin: 0,
            padding: 0,
            alignItems: "center",
          }}
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.label}>
                {l.disabled ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setToast("Scan a repo first")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setToast("Scan a repo first"); }}
                    style={{
                      padding: "4px 10px",
                      color: "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {l.label}
                  </span>
                ) : (
                  <Link
                    href={l.href}
                    style={{
                      padding: "4px 10px",
                      color: active ? "var(--text)" : "var(--muted)",
                      background: active
                        ? "rgba(255,255,255,0.04)"
                        : "transparent",
                      textDecoration: "none",
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <span
          style={{
            marginLeft: "auto",
            color: "var(--muted)",
            fontSize: "10px",
          }}
        >
          v0.1.0
        </span>
      </nav>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </header>
  );
}
