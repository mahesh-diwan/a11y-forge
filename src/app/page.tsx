"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import type { ScanResult, FixPR } from "@/lib/types";
import { ErrorBanner, ActivityLog, ScanSkeleton } from "@/components/states";
import { Stepper } from "@/components/ui/Stepper";
import type { StepState } from "@/components/ui/Stepper";
import { Nav } from "@/components/Nav";
import { ForgeHero } from "@/components/ForgeHero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { DocsPage } from "@/components/DocsPage";
import { Dashboard } from "@/components/Dashboard";
import { ScanForm } from "@/components/ScanForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FilterBar } from "@/components/FilterBar";
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
  const [filterTag, setFilterTag] = useState("all");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

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
    <div className="min-h-[100dvh]" style={{ background: "var(--color-canvas)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <Nav activeView={activeView} onViewChange={setActiveView} />

      <main id="main-content" className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {activeView === "forge" && (
          <section id="forge">
            <h1
              className="font-display text-3xl font-bold leading-tight sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Paste a repo.{" "}
              <span style={{ color: "var(--color-pass)" }}>
                equity ships the fixes.
              </span>
            </h1>
            <p
              className="mt-2 max-w-lg text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              equity checks every file for WCAG violations and opens pull
              requests with fixes.
            </p>
            <div className="mt-4">
              <ScanForm
                repoUrl={repoUrl}
                onUrlChange={setRepoUrl}
                onSubmit={handleScan}
                onCancel={handleCancel}
                phase={phase}
                error={error}
                inputRef={inputRef}
              />
            </div>
            {phase !== "idle" && phase !== "done" && (
              <div className="my-4">
                <Stepper steps={steps} />
              </div>
            )}
            <ForgeHero />
            {result && (
              <FilterBar active={filterTag} onChange={setFilterTag} />
            )}
            <Dashboard
              result={result}
              phase={phase}
              prs={prs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              download={download}
            />
            <ActivityLog log={log} />
          </section>
        )}
        {activeView === "guide" && <HowItWorksSection />}
        {activeView === "docs" && <DocsPage />}
        {activeView === "dashboard" && (
          <section id="results-section" className="mt-16 scroll-mt-24">
            {phase !== "idle" && phase !== "done" && (
              <div className="mb-8">
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

        <ConfirmDialog
          repoUrl={repoUrl}
          groupCount={prs.length || 0}
          open={confirmOpen}
          onConfirm={handleConfirmScan}
          onCancel={() => setConfirmOpen(false)}
        />

        {error && <ErrorBanner message={error} />}
      </main>
    </div>
  );
}
