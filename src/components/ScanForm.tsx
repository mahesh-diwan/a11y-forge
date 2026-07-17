import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";

interface ScanFormProps {
  repoUrl: string;
  onUrlChange: (url: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  phase: "idle" | "scanning" | "prioritizing" | "fixing" | "done";
  error: string | null;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ScanForm({
  repoUrl,
  onUrlChange,
  onSubmit,
  onCancel,
  phase,
  inputRef,
}: ScanFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 items-center rounded-full border border-[var(--color-border)] bg-black/20 font-mono text-sm transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:border-[var(--color-focus)]">
        <span className="shrink-0 pl-3 text-xs" style={{ color: "var(--color-pass)" }} aria-hidden="true">$</span>
        <input
          ref={inputRef}
          type="text"
          value={repoUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repository URL"
          className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-[var(--color-muted)]"
          disabled={phase !== "idle"}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
        Paste your project's GitHub repository link — not your live website URL.
      </p>
      <Button type="submit" loading={phase !== "idle"} loadingLabel="Running…" disabled={phase !== "idle" || !repoUrl}>
        run
      </Button>
      {phase !== "idle" && (
        <Button type="button" variant="secondary" onClick={onCancel}>
          cancel
        </Button>
      )}
    </form>
  );
}
