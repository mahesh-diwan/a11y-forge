"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ScanResult, FixPR } from "./types";

type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";
type Tab = "violations" | "reader" | "diff";

interface ResultsState {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  phase: Phase;
  result: ScanResult | null;
  prs: FixPR[];
  activeTab: Tab;
  error: string | null;
}

interface ResultsActions {
  scan: (url: string) => Promise<void>;
  cancel: () => void;
  demo: () => void;
  download: (kind: "report" | "badge" | "pdf") => void;
  setActiveTab: (tab: Tab) => void;
}

const Ctx = createContext<(ResultsState & ResultsActions) | null>(null);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [prs, setPrs] = useState<FixPR[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("violations");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const downloadLock = useRef<Set<string>>(new Set());

  const scan = useCallback(
    async (url: string) => {
      setRepoUrl(url);
      setError(null);
      setResult(null);
      setPrs([]);
      setPhase("scanning");

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const { runWorkflow } = await import("./workflow");
        await runWorkflow(url, {
          onPhase: setPhase,
          onLog: () => {},
          onResult: setResult,
          onPr: (pr) => setPrs((prev) => [...prev, pr]),
          signal: ctrl.signal,
          consentToAi: true,
          dryRun: false,
        });
        router.push("/results");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setPhase("idle");
      } finally {
        abortRef.current = null;
      }
    },
    [router],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
  }, []);

  const demo = useCallback(async () => {
    try {
      const { DEMO_RESULT, DEMO_PRS } = await import("./demo-data");
      setRepoUrl("github.com/mahesh-diwan/a11y-forge-demo");
      setError(null);
      setResult(DEMO_RESULT);
      setPrs(DEMO_PRS);
      setPhase("done");
      router.push("/results");
    } catch {
      setError("Failed to load demo data");
    }
  }, [router]);

  const download = useCallback(
    (kind: "report" | "badge" | "pdf") => {
      if (!result) return;
      if (downloadLock.current.has(kind)) return;
      downloadLock.current.add(kind);
      const path =
        kind === "pdf"
          ? "/api/report/pdf"
          : kind === "badge"
            ? "/api/badge"
            : "/api/report";
      const body = kind === "badge" ? { score: result.score } : result;
      fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (!r.ok) throw new Error("Download failed");
          return r.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            kind === "pdf"
              ? "a11y-report.pdf"
              : kind === "badge"
                ? "a11y-badge.svg"
                : "a11y-report.html";
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch(() => {})
        .finally(() => {
          downloadLock.current.delete(kind);
        });
    },
    [result],
  );

  return (
    <Ctx.Provider
      value={{
        repoUrl,
        setRepoUrl,
        phase,
        result,
        prs,
        activeTab,
        error,
        scan,
        cancel,
        demo,
        download,
        setActiveTab,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useResults() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useResults must be inside ResultsProvider");
  return ctx;
}
