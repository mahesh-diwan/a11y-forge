import type { ScanResult, FixGroup, FixPR } from "./types";

/**
 * Phases of accessibility workflow pipeline.
 * Idle → scanning → prioritizing → fixing → done.
 */
export type Phase = "idle" | "scanning" | "prioritizing" | "fixing" | "done";

/**
 * Hooks for observing workflow lifecycle.
 *
 * Why: Allows callers to react to phase changes, log messages, receive scan results,
 * and intercept PR creation events. Supports abort via AbortSignal.
 */
export interface WorkflowHooks {
  onPhase?: (phase: Phase) => void;
  onLog?: (msg: string) => void;
  onResult?: (result: ScanResult) => void;
  onPr?: (pr: FixPR) => void;
  signal?: AbortSignal;
  consentToAi?: boolean;
  dryRun?: boolean;
}

/**
 * Abstract interface for workflow API operations.
 *
 * Why: Decouples runWorkflow from HTTP. Enables testing with fake adapters
 * and swapping transport (e.g. workers, IPC) without changing orchestrator.
 */
export interface WorkflowAdapter {
  scan(repoUrl: string, signal?: AbortSignal): Promise<ScanResult>;
  prioritize(repoUrl: string, violations: ScanResult["violations"], consentToAi?: boolean, signal?: AbortSignal): Promise<FixGroup[]>;
  createPr(repoUrl: string, group: FixGroup, consentToAi?: boolean, signal?: AbortSignal): Promise<FixPR>;
}

/**
 * Default HTTP adapter — calls internal API routes via fetch.
 *
 * Why: Encapsulates fetch calls to /api/scan, /api/prioritize, /api/pr.
 * runWorkflow uses this unless a custom adapter is injected.
 */
export class HttpWorkflowAdapter implements WorkflowAdapter {
  private async callApi(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const errBody = await res.json();
      const msg = typeof errBody.error === "string" ? errBody.error : errBody.error?.message || `${path} request failed`;
      throw new Error(msg);
    }
    return res.json();
  }

  async scan(repoUrl: string, signal?: AbortSignal): Promise<ScanResult> {
    const data = await this.callApi("/api/scan", { repoUrl }, signal);
    return data as ScanResult;
  }

  async prioritize(repoUrl: string, violations: ScanResult["violations"], consentToAi?: boolean, signal?: AbortSignal): Promise<FixGroup[]> {
    const data = await this.callApi("/api/prioritize", { repoUrl, violations, consentToAi }, signal);
    const resp = data as { groups?: FixGroup[] };
    return resp.groups ?? [];
  }

  async createPr(repoUrl: string, group: FixGroup, consentToAi?: boolean, signal?: AbortSignal, dryRun?: boolean): Promise<FixPR> {
    const data = await this.callApi("/api/pr", { repoUrl, group, consentToAi, dryRun }, signal);
    return data as FixPR;
  }
}

/**
 * Runs full accessibility workflow: scan → prioritize → fix.
 *
 * Why: Orchestrates multi-step pipeline via adapter. Each step respects abort signal.
 * When violations found, generates fix groups and creates PRs per group.
 * Gracefully skips groups that fail, continues to next.
 *
 * @param repoUrl - GitHub repository URL to scan.
 * @param hooks - Optional lifecycle hooks for phase/log/result/PR events and abort signal.
 * @param adapter - Optional workflow adapter (defaults to HttpWorkflowAdapter).
 * @throws DOMException with name "AbortError" if aborted via signal.
 * @throws Error if scan or prioritization API calls fail.
 */
export async function runWorkflow(repoUrl: string, hooks: WorkflowHooks = {}, adapter?: WorkflowAdapter): Promise<void> {
  const { onPhase, onLog, onResult, onPr, signal } = hooks;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);

  const api = adapter ?? new HttpWorkflowAdapter();

  const guard = () => {
    if (ctrl.signal.aborted) throw new DOMException("Aborted", "AbortError");
  };

  try {
    onPhase?.("scanning");
    onLog?.("starting scan...");

    guard();
    const scanData = await api.scan(repoUrl, ctrl.signal);
    onResult?.(scanData);
    onLog?.(`score: ${scanData.score?.grade || "?"} (${scanData.score?.score || 0}/100)`);
    onLog?.(`found ${scanData.violations.length} violations`);

    if (scanData.violations.length === 0) {
      onLog?.("no violations found. repo clean.");
      onPhase?.("done");
      return;
    }

    guard();
    onPhase?.("prioritizing");
    onLog?.("prioritizing...");
    const groups = await api.prioritize(repoUrl, scanData.violations, hooks.consentToAi, ctrl.signal);
    guard();
    if (!groups || groups.length === 0) {
      onLog?.("no fix groups generated");
      onPhase?.("done");
      return;
    }
    onLog?.(`prioritized ${groups.length} fix groups`);

    guard();
    onPhase?.("fixing");
    for (const group of groups) {
      guard();
      try {
        onLog?.(`fixing: ${group.category}...`);
        const pr = await api.createPr(repoUrl, group, hooks.consentToAi, ctrl.signal, hooks.dryRun);
        guard();
        onPr?.(pr);
        onLog?.(`pr created: ${pr.url}`);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        const msg = err instanceof Error ? err.message : "PR step failed";
        onLog?.(`skipped ${group.category}: ${msg}`);
      }
    }

    onPhase?.("done");
    onLog?.("done!");
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
