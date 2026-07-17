"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import type { ScanResult, FixPR } from "@/lib/types";
import { ErrorBanner, ActivityLog, ScanSkeleton } from "@/components/states";
import { Stepper, type StepState } from "@/components/ui/Stepper";
import { Nav } from "@/components/Nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ForgeHero } from "@/components/ForgeHero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { DocsPage } from "@/components/DocsPage";
import { Dashboard } from "@/components/Dashboard";
import { ScanForm } from "@/components/ScanForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useReveal } from "@/lib/useReveal";
import { useKeyboard } from "@/lib/useKeyboard";
import { runWorkflow } from "@/lib/workflow";

type Tab = "violations" | "reader" | "diff";
type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [prs, setPrs] = useState<FixPR[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("violations");
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("forge");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

  const { ref: heroRef, visible: heroVisible } = useReveal<HTMLDivElement>();
  const { ref: resultsRef, visible: resultsVisible } = useReveal<HTMLDivElement>();

  useKeyboard({
    s: () => { if (phase === "idle") inputRef.current?.focus(); },
    Escape: () => { if (confirmOpen) setConfirmOpen(false); else if (phase !== "idle") handleCancel(); },
  });

  function addLog(msg: string) {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function download(kind: "report" | "badge" | "pdf") {
    if (!result) return;
    if (downloadLock.current.has(kind)) return;
    downloadLock.current.add(kind);
    const path = kind === "pdf" ? "/api/report/pdf" : kind === "badge" ? "/api/badge" : "/api/report";
    const body = kind === "badge" ? { score: result.score } : result;
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error("Download failed");
      return r.blob();
    }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "pdf" ? "a11y-report.pdf" : kind === "badge" ? "a11y-badge.svg" : "a11y-report.html";
      a.click();
      URL.revokeObjectURL(url);
    }).catch((err) => addLog(err instanceof Error ? err.message : "Download failed"))
      .finally(() => { downloadLock.current.delete(kind); });
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl) return;
    if (!/github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      setError("Enter a valid GitHub repo URL (https://github.com/owner/repo).");
      addLog("Error: invalid repo URL");
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmScan(dryRun: boolean, consentToAi: boolean) {
    setConfirmOpen(false);
    setResult(null);
    setPrs([]);
    setLog([]);
    setError(null);
    setPhase("scanning");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        await runWorkflow(repoUrl, {
          onPhase: setPhase,
          onLog: addLog,
          onResult: setResult,
          onPr: (pr) => setPrs((prev) => [...prev, pr]),
          signal: ctrl.signal,
          consentToAi,
          dryRun,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          addLog("Cancelled by user.");
          setPhase("idle");
          return;
        }
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        addLog(`Error: ${msg}`);
        setPhase("idle");
      } finally {
        abortRef.current = null;
      }
    })();
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  useEffect(() => {
    if (result) {
      setActiveView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result]);

  const steps: { label: string; state: StepState }[] = [
    { label: "Scan", state: phase === "idle" ? "upcoming" : phase === "scanning" ? "current" : "done" },
    { label: "Prioritize", state: phase === "scanning" || phase === "idle" ? "upcoming" : phase === "prioritizing" ? "current" : "done" },
    { label: "Fix & PR", state: phase === "fixing" ? "current" : phase === "done" ? "done" : "upcoming" },
  ];

  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--color-ink)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <Nav activeView={activeView} onViewChange={setActiveView} />

      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <ErrorBoundary>
        {activeView === "forge" && (
          <section
            ref={heroRef}
            className={`reveal ${heroVisible ? "is-visible" : ""} relative pb-24 pt-16`}
            id="forge"
          >
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--color-amber)" }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-amber)", boxShadow: "0 0 8px var(--color-amber)" }} />
                automated accessibility from commit to PR
              </span>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl" style={{ textWrap: "balance" }}>
                Paste a repo.
                <br />
                <span style={{ color: "var(--color-amber)" }}>equity ships the fixes.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--color-muted)" }}>
                equity checks every file for missing alt text, unclear labels, low contrast,
                and keyboard traps — then opens pull requests with the fixes, ready for you to review and approve.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-8">
              <div className="mx-auto w-full max-w-xl">
                <ScanForm
                  repoUrl={repoUrl}
                  onUrlChange={setRepoUrl}
                  onSubmit={handleScan}
                  onCancel={handleCancel}
                  phase={phase}
                  error={error}
                  inputRef={inputRef}
                />
                <p className="mt-3 text-center font-mono text-[11px]" style={{ color: "var(--color-muted)" }}>
                  Works with public GitHub repos. Paste a link, equity does the rest.
                </p>
              </div>

              <div className="w-full">
                <ForgeHero />
              </div>
            </div>
          </section>
        )}

        {activeView === "guide" && <HowItWorksSection />}

        {activeView === "docs" && <DocsPage />}

        {activeView === "dashboard" && (
          <section
            ref={resultsRef}
            id="results-section"
            className={`reveal ${resultsVisible ? "is-visible" : ""} mt-16 scroll-mt-24`}
          >
            {phase !== "idle" && phase !== "done" && (
              <div className="mb-8" key={`stepper-${phase}`}>
                <Stepper steps={steps} />
              </div>
            )}
            <Dashboard
              result={result}
              phase={phase}
              prs={prs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              download={download}
            />
            {phase === "scanning" && !result && <ScanSkeleton />}
          </section>
        )}

        <ActivityLog log={log} />

        <ConfirmDialog
          repoUrl={repoUrl}
          groupCount={prs.length || 0}
          open={confirmOpen}
          onConfirm={handleConfirmScan}
          onCancel={() => setConfirmOpen(false)}
        />

        {error && <ErrorBanner message={error} />}
        </ErrorBoundary>
      </main>

      <footer className="relative z-10 border-t border-[var(--color-border)] py-6 text-center font-mono text-[10px]" style={{ color: "var(--color-muted)" }}>
        equity // automated a11y from commit to pr
      </footer>
    </div>
  );
}
