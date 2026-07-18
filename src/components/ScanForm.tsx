"use client";

import { FormEvent, RefObject } from "react";

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
  done: "Done",
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

  return (
    <div>
      <form
        onSubmit={isWorking ? (e) => { e.preventDefault(); onCancel(); } : onSubmit}
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
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
          {PHASE_LABELS[phase]}
        </p>
      )}
      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--fail)", marginTop: "8px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
