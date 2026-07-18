"use client";

import { useResults } from "@/lib/ResultsContext";
import { Nav } from "@/components/Nav";
import { Results } from "@/components/Results";
import { Footer } from "@/components/Footer";

export default function ResultsPage() {
  const { result, prs, activeTab, setActiveTab, download } = useResults();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas)",
        color: "var(--text)",
      }}
    >
      <Nav />
      <main
        id="main-content"
        style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}
      >
        {result ? (
          <Results
            result={result}
            prs={prs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            download={download}
          />
        ) : (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--muted)",
              textAlign: "center",
              padding: "120px 0",
            }}
          >
            No results yet.{" "}
            <a href="/" style={{ color: "var(--accent)" }}>
              Scan a repo
            </a>{" "}
            first.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
