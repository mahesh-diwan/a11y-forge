"use client";

import type { ScanResult, FixPR } from "@/lib/types";
import { ScoreCard } from "@/components/ScoreCard";
import { ViolationCard } from "@/components/ViolationCard";
import { Tabs } from "@/components/Tabs";
import { PRCard } from "@/components/PRCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useReveal } from "@/lib/useReveal";

const FIX_SUGGESTION: Record<string, string> = {
  "missing-alt-text": '<img src="..." alt="descriptive text" />',
  "missing-aria-label": '<button aria-label="action">...</button>',
  "missing-form-label": '<input aria-label="field" />',
  "missing-html-lang": '<html lang="en">',
  "low-contrast": '<span style="color:#111;background:#fff">high contrast</span>',
  "missing-aria-modal": '<div role="dialog" aria-modal="true">...</div>',
};

const FIX_FALLBACK = "apply accessibility fix";

type Tab = "violations" | "reader" | "diff";

interface DashboardProps {
  result: ScanResult | null;
  phase: "idle" | "scanning" | "prioritizing" | "fixing" | "done";
  prs: FixPR[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  download: (kind: "report" | "badge" | "pdf") => void;
}

export function Dashboard({ result, phase, prs, activeTab, onTabChange, download }: DashboardProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  const realDiffs = prs.flatMap((pr) => pr.diffs ?? []);

  return (
    <div ref={ref} className={`reveal ${visible ? "is-visible" : ""}`}>
      <h1 className="sr-only" style={{ color: "var(--color-text)" }}>
        Results
      </h1>
      {!result && phase === "idle" && (
        <div className="bezel">
          <div className="bezel-core p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full" style={{ background: "var(--color-pass)" }} aria-hidden />
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--color-muted)" }}>
                pre-scan
              </span>
            </div>

            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-text)" }}>
              Nothing scanned yet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
              Run a scan from the top of the page. When it finishes, this panel fills with your
              accessibility score, the issues equity found, and the fix pull requests it opens.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["score", "0–100 + letter grade"],
                ["issues", "issues + screen reader preview"],
                ["prs", "auto-generated fix PRs"],
              ].map(([label, desc]) => (
                <div key={label} className="rounded-lg border border-[var(--color-border)] p-3" style={{ background: "var(--color-surface)" }}>
                  <p className="font-mono text-xs font-semibold" style={{ color: "var(--color-text)" }}>{label}</p>
                  <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--color-muted)" }}>{desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 font-mono text-xs" style={{ color: "var(--color-pass)" }}>
              → run a scan from the Scan tab to begin
            </p>
          </div>
        </div>
      )}

      {result?.score && (
        (() => {
          const g = result.score.grade;
          const pass = g === "A+" || g === "A" || g === "B";
          const color = pass ? "#22c55e" : g === "F" ? "#ef4444" : "#ffb700";
          const msg = pass ? "✅ Your site passes WCAG checks" : "⚠️ Your site needs fixes";
          return (
            <div
              className="mb-8 flex items-center gap-3 rounded-xl border px-5 py-4 font-semibold"
              style={{ borderColor: color, color, background: `${color}1a` }}
              role="status"
            >
              <span>{msg}</span>
            </div>
          );
        })()
      )}

      {result?.score && (
        <div className="bezel mb-8" key={`score-${phase}`}>
          <div className="bezel-core p-6 sm:p-8">
            <ScoreCard score={result.score} onReport={() => download("report")} onBadge={() => download("badge")} />
          </div>
        </div>
      )}

      {result && (
        <section className="mt-10" id="dashboard" key={`dash-${phase}`}>
          <Tabs<Tab>
            tabs={["violations", "reader", "diff"] as const}
            active={activeTab}
            onChange={onTabChange}
            renderLabel={(t) =>
              t === "violations" ? `Issues Found (${result.violations.length})` :
              t === "reader" ? "Screen Reader Preview" : "Before / After"
            }
          />

          {activeTab === "violations" && (
            result.violations.length > 0 ? (
              <div role="tabpanel" id="panel-violations" aria-labelledby="tab-violations" tabIndex={0} className="grid grid-cols-1 gap-4 lg:grid-cols-6 focus:outline-none">
                {result.violations.map((v, i) => (
                  <div key={i} className={cn("bezel", [
                    "lg:col-span-4", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3",
                    "lg:col-span-2", "lg:col-span-4",
                  ][i % 6])}>
                    <div className="bezel-core p-4">
                      <ViolationCard v={v} conf={result.confidence?.[i]} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div role="tabpanel" id="panel-violations" aria-labelledby="tab-violations" tabIndex={0} className="bezel focus:outline-none">
                <div className="bezel-core p-8 text-center">
                  <p className="font-display text-2xl font-bold" style={{ color: "var(--color-pass)" }}>No issues found 🎉</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    equity found zero accessibility violations in this repo.
                  </p>
                </div>
              </div>
            )
          )}

          {activeTab === "reader" && (
            result.screenReader && result.screenReader.length > 0 ? (
              <div role="tabpanel" id="panel-reader" aria-labelledby="tab-reader" tabIndex={0} className="grid grid-cols-1 gap-4 lg:grid-cols-3 focus:outline-none">
                {result.screenReader.map((sr, i) => (
                  <div key={i} className={cn("bezel", i === 0 && "lg:col-span-2")}>
                    <div className="bezel-core p-4">
                      <div>
                        <div className="mb-2 flex items-start justify-between">
                          <span className="font-mono text-sm font-medium" style={{ color: "var(--color-focus)" }}>{sr.element}</span>
                          <span className="font-mono text-xs" style={{ color: "var(--color-muted)" }}>{sr.file}:{sr.line}</span>
                        </div>
                        <p className="mb-3 text-xs" style={{ color: "var(--color-muted)" }}>{sr.violation}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-[var(--color-fail)]/30 p-3" style={{ background: "var(--color-fail-bg)" }}>
                            <span className="mb-1 block text-xs font-mono v-badge-fail">current</span>
                            <p className="text-sm">{sr.current}</p>
                          </div>
                          <div className="rounded-lg border border-[var(--color-pass)]/30 p-3" style={{ background: "var(--color-pass-bg)" }}>
                            <span className="mb-1 block text-xs font-mono v-badge-pass">estimated fix</span>
                            <p className="text-sm">{sr.fixed}</p>
                          </div>
                          <p className="mt-2 col-span-2 font-mono text-[10px]" style={{ color: "var(--color-muted)" }}>
                            Illustrative — verify with a real screen reader (VoiceOver/NVDA).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div role="tabpanel" id="panel-reader" aria-labelledby="tab-reader" tabIndex={0} className="bezel focus:outline-none">
                <div className="bezel-core p-8 text-center">
                  <p className="font-display text-xl font-bold" style={{ color: "var(--color-text)" }}>No screen reader preview</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    Nothing to narrate for this scan.
                  </p>
                </div>
              </div>
            )
          )}

          {activeTab === "diff" && (
            <div role="tabpanel" id="panel-diff" aria-labelledby="tab-diff" tabIndex={0} className="space-y-6 focus:outline-none">
              {result.score && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bezel">
                    <div className="bezel-core p-6 text-center">
                      <p className="mb-2 text-xs font-mono" style={{ color: "var(--color-muted)" }}>before</p>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl border font-display text-3xl font-bold" style={{ borderColor: result.score.color, color: result.score.color }}>
                        {result.score.grade}
                      </div>
                      <span className="mt-2 font-mono text-xs" style={{ color: "var(--color-muted)" }}>{result.score.totalViolations} violations</span>
                    </div>
                  </div>
                  <div className="bezel">
                    <div className="bezel-core p-6 text-center">
                      <p className="mb-2 text-xs font-mono v-badge-pass">after</p>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl border-2 font-display text-3xl font-bold v-badge-pass">✓</div>
                      <span className="mt-2 font-mono text-xs" style={{ color: "var(--color-muted)" }}>{result.violations.length} violations addressed</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="bezel">
                <div className="bezel-core p-6">
                  {realDiffs.length > 0 ? (
                    <div className="space-y-4 font-mono text-xs">
                      {realDiffs.map((d, i) => (
                        <div key={i} className="space-y-2">
                          <span className="text-xs font-mono v-badge-pass">real fix</span>
                          <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>{d.file}</span>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="overflow-x-auto rounded border border-[var(--color-fail)]/30 p-2" style={{ background: "var(--color-fail-bg)", color: "var(--color-fail)" }}>
                              <span className="mb-1 block text-[10px]" style={{ color: "var(--color-muted)" }}>before</span>
                              {d.before.substring(0, 80) || "(new file)"}
                            </div>
                            <div className="overflow-x-auto rounded border border-[var(--color-pass)]/30 p-2" style={{ background: "var(--color-pass-bg)", color: "var(--color-pass)" }}>
                              <span className="mb-1 block text-[10px]" style={{ color: "var(--color-muted)" }}>after</span>
                              {d.after.substring(0, 80)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 font-mono text-xs">
                      <p className="mb-2 text-[10px]" style={{ color: "var(--color-muted)" }}>suggested (no live diff captured)</p>
                      {result.violations.slice(0, 5).map((v, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="overflow-x-auto rounded border border-[var(--color-fail)]/30 p-2" style={{ background: "var(--color-fail-bg)", color: "var(--color-fail)" }}>
                            - {v.snippet?.substring(0, 80) || v.description}
                          </div>
                          <div className="overflow-x-auto rounded border border-[var(--color-pass)]/30 p-2" style={{ background: "var(--color-pass-bg)", color: "var(--color-pass)" }}>
                            + {FIX_SUGGESTION[v.type] ?? FIX_FALLBACK}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="secondary" onClick={() => download("pdf")}>
                download report
              </Button>
            </div>
          )}
        </section>
      )}

      {prs.length > 0 && (
        <section className="mt-10" id="pull-requests" key={`prs-${prs.length}`}>
          <h3 className="mb-3 text-xs font-mono" style={{ color: "var(--color-muted)" }}>pull requests created</h3>
          <p className="mb-4 text-sm" style={{ color: "var(--color-muted)" }}>
            Fixes were sent to your GitHub repository.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prs.map((pr, i) => (
              <div key={i} className="bezel">
                <div className="bezel-core p-4">
                  <PRCard pr={pr} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
