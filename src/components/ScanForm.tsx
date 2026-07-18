"use client";
import { type FormEvent, type RefObject } from "react";

interface ScanFormProps {
  repoUrl: string;
  onUrlChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  phase: string;
  error: string | null;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function ScanForm({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  phase,
  error,
  inputRef,
}: ScanFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={repoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repo URL"
          className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none transition"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>
      {phase === "idle" ? (
        <button
          type="submit"
          className="rounded-lg px-4 py-2 font-mono text-sm font-bold transition active:scale-[0.97]"
          style={{ background: "var(--color-pass)", color: "#000" }}
        >
          Scan
        </button>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 font-mono text-sm transition"
          style={{
            borderColor: "var(--color-fail)",
            color: "var(--color-fail)",
          }}
        >
          Cancel
        </button>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--color-fail)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
