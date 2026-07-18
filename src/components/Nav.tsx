"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResults } from "@/lib/ResultsContext";

export function Nav() {
  const pathname = usePathname();
  const { result } = useResults();

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
            const disabled = l.disabled;
            return (
              <li key={l.label}>
                {disabled ? (
                  <span
                    style={{
                      padding: "4px 10px",
                      color: "var(--muted)",
                      opacity: 0.4,
                      cursor: "default",
                      textDecoration: "none",
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
    </header>
  );
}
