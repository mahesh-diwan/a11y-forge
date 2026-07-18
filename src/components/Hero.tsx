"use client";

import { FormEvent, RefObject } from "react";
import { ScanForm } from "./ScanForm";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

interface HeroProps {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onDemo: () => void;
  phase: Phase;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  violationsCount: number;
  filesCount: number;
  prsCount: number;
}

export function Hero({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  onDemo,
  phase,
  error,
  inputRef,
  violationsCount,
  filesCount,
  prsCount,
}: HeroProps) {
  return (
    <section id="scan" style={{ paddingTop: "120px", paddingBottom: "48px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 800,
          margin: "0 0 8px 0",
          lineHeight: 1.1,
        }}
      >
        a11y-forge
      </h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0" }}>
        Autonomous accessibility fixes for your repos
      </p>

      <ScanForm
        repoUrl={repoUrl}
        onUrlChange={onUrlChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDemo={onDemo}
        phase={phase}
        error={error}
        inputRef={inputRef}
      />

      <div style={{ borderTop: "1px solid var(--border)", marginTop: "24px", paddingTop: "16px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", margin: 0 }}>
          <span style={{ color: "var(--accent)" }}>{violationsCount} violations</span>
          {" \u00b7 "}
          {filesCount} files
          {" \u00b7 "}
          <span style={{ color: "var(--accent)" }}>{prsCount} PRs opened</span>
        </p>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginTop: "24px", maxWidth: "480px" }}>
        Scan any public GitHub repo. No config required. a11y-forge checks HTML, JSX, CSS for WCAG 2.2 violations and opens pull requests with fixes.
      </p>
    </section>
  );
}
