"use client";

import { useState, useRef, FormEvent } from "react";
import type { ScanResult, FixPR } from "@/lib/types";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Guide } from "@/components/Guide";
import { Results } from "@/components/Results";
import { Docs } from "@/components/Docs";
import { Footer } from "@/components/Footer";
import { runWorkflow } from "@/lib/workflow";
import { DEMO_RESULT, DEMO_PRS } from "@/lib/demo-data";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";
type Tab = "violations" | "reader" | "diff";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [prs, setPrs] = useState<FixPR[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("violations");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

  function handleDemo() {
    setRepoUrl("github.com/mahesh-diwan/a11y-forge-demo");
    setPhase("scanning");
    setError(null);
    setResult(null);
    setPrs([]);
    setTimeout(() => { setPhase("done"); setResult(DEMO_RESULT); setPrs(DEMO_PRS); }, 1200);
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl) return;
    if (!/github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      setError("Enter a valid GitHub repo URL (https://github.com/owner/repo).");
      return;
    }
    setError(null);
    setResult(null);
    setPrs([]);
    setPhase("scanning");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await runWorkflow(repoUrl, {
        onPhase: setPhase,
        onLog: () => {},
        onResult: setResult,
        onPr: (pr) => setPrs((prev) => [...prev, pr]),
        signal: ctrl.signal,
        consentToAi: false,
        dryRun: true,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("idle");
    } finally {
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setPhase("idle");
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
    }).catch(() => {})
      .finally(() => { downloadLock.current.delete(kind); });
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)", color: "var(--text)" }}>
      <Nav activeView={phase === "done" || result ? "results" : "scan"} onViewChange={() => {}} />
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
        <Hero
          repoUrl={repoUrl}
          onUrlChange={setRepoUrl}
          onSubmit={handleScan}
          onCancel={handleCancel}
          onDemo={handleDemo}
          phase={phase}
          error={error}
          inputRef={inputRef}
          violationsCount={result?.violations.length ?? 12}
          filesCount={result?.score?.affectedFiles.length ?? 8}
          prsCount={prs.length ?? 3}
        />
        <Guide />
        <Results result={result} prs={prs} activeTab={activeTab} onTabChange={setActiveTab} download={download} />
        <Docs />
        <Footer />
      </main>
    </div>
  );
}
