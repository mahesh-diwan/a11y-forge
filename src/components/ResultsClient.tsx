"use client";

import { useResults } from "@/lib/ResultsContext";
import { Results } from "@/components/Results";

export function ResultsClient() {
  const { result, prs, activeTab, setActiveTab, download } = useResults();

  if (!result) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "120px 0" }}>
        No results yet.{" "}
        <a href="/" style={{ color: "var(--accent)" }}>
          Scan a repo
        </a>{" "}
        first.
      </p>
    );
  }

  return (
    <Results
      result={result}
      prs={prs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      download={download}
    />
  );
}
