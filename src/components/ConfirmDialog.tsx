"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ConfirmDialogProps {
  repoUrl: string;
  groupCount: number;
  open: boolean;
  onConfirm: (dryRun: boolean, consentToAi: boolean) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  repoUrl,
  groupCount,
  open,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [dryRun, setDryRun] = useState(false);
  const [consentToAi, setConsentToAi] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const main = document.getElementById("main-content");
    const footer = document.querySelector("footer");
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");

    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    dialogRef.current?.addEventListener("keydown", onKey);

    return () => {
      dialogRef.current?.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm pull request creation"
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open
          ? "opacity-100 visible pointer-events-auto"
          : "opacity-0 invisible pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
          className={cn(
            "relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open
            ? "opacity-100 scale-100 visible pointer-events-auto"
            : "opacity-0 scale-95 invisible pointer-events-none"
        )}
      >
        <div className="space-y-4">
          {/* Repo URL */}
          <p className="font-mono text-sm text-[var(--color-text)] truncate">
            {repoUrl}
          </p>

          {/* PR count */}
          <p className="text-sm text-[var(--color-muted)]">
            {groupCount > 0
              ? `${groupCount} pull request${groupCount !== 1 ? "s" : ""} to create`
              : "Scan your repo. Fixes get opened as pull requests."}
          </p>

          {/* Dry-run toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-label="Dry run"
              aria-checked={dryRun}
              onClick={() => setDryRun((p) => !p)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-[var(--color-border)] transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
                dryRun
                  ? "bg-[var(--color-pass)] border-[var(--color-pass)]"
                  : "bg-[var(--color-surface)]"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  dryRun ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-sm text-[var(--color-muted)]">Preview only (no changes sent)</span>
          </label>

          {/* AI consent */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentToAi}
              onChange={(e) => setConsentToAi(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-[var(--color-muted)] leading-relaxed">
              Allow equity to read your code to generate fixes. Your code is never saved or shared.
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="primary"
              onClick={() => onConfirm(dryRun, consentToAi)}
              disabled={!consentToAi}
              className="flex-1"
            >
              Send me the fixes
            </Button>
            <Button
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--color-muted)" }}>
            A pull request is how we hand the fixes back to your GitHub repo.
          </p>
        </div>
      </div>
    </div>
  );
}
