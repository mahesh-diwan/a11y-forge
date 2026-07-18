"use client";

import { FormEvent, RefObject, useState, useEffect } from "react";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

interface ScanFormProps {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onDemo: () => void;
  phase: Phase;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Scan",
  scanning: "Scanning\u2026",
  prioritizing: "Prioritizing\u2026",
  fixing: "Fixing\u2026",
  done: "Scan",
};

const PHASE_PROGRESS: Record<Phase, number> = {
  idle: 0,
  scanning: 30,
  prioritizing: 60,
  fixing: 85,
  done: 100,
};

export function ScanForm({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  onDemo,
  phase,
  error,
  inputRef,
}: ScanFormProps) {
  const isWorking = phase !== "idle" && phase !== "done";
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (document.getElementById("a11y-spinner-style")) return;
    const style = document.createElement("style");
    style.id = "a11y-spinner-style";
    style.textContent = `
      @keyframes a11y-spin {
        to { transform: rotate(360deg); }
      }
      .a11y-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: a11y-spin 0.6s linear infinite;
        vertical-align: middle;
        margin-right: 6px;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isWorking) { setElapsed(0); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isWorking]);

  return (
    <div>
      <form
        onSubmit={isWorking ? (e) => { e.preventDefault(); onCancel(); } : onSubmit}
        noValidate
        style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
      >
        <input
          ref={inputRef}
          type="url"
          value={repoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={isWorking}
          aria-label="GitHub repository URL"
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: isWorking ? "var(--surface)" : "var(--accent)",
            border: "1px solid var(--border)",
            color: isWorking ? "var(--muted)" : "#000",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isWorking ? "Cancel" : PHASE_LABELS[phase]}
        </button>
      </form>
      {phase === "idle" && (
        <button
          type="button"
          onClick={onDemo}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          try demo repo →
        </button>
      )}
      {phase !== "idle" && (
        {isWorking && (
        <p style={{ marginTop: "8px" }}>
          <span style={{ display: "block", height: "4px", background: "var(--surface)", borderRadius: 0, overflow: "hidden", marginBottom: "6px" }}>
            <span style={{ display: "block", height: "4px", width: `${PHASE_PROGRESS[phase]}%`, background: "var(--accent)", }} />
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
            {PHASE_LABELS[phase]} ({elapsed}s)
          </span>
        </p>
      )}
      )}
      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--fail)", marginTop: "8px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
