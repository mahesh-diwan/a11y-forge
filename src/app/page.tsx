"use client";

import { useRef, FormEvent } from "react";
import { useResults } from "@/lib/ResultsContext";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Guide } from "@/components/Guide";

export default function Home() {
  const {
    repoUrl,
    setRepoUrl,
    phase,
    error,
    result,
    prs,
    scan,
    cancel,
    demo,
    setError,
  } = useResults();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl) return;
    if (!/github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      setError(
        "Enter a valid GitHub repo URL (https://github.com/owner/repo).",
      );
      return;
    }
    scan(repoUrl);
  }

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
        <Hero
          repoUrl={repoUrl}
          onUrlChange={setRepoUrl}
          onSubmit={handleSubmit}
          onCancel={cancel}
          onDemo={demo}
          phase={phase}
          error={error}
          inputRef={inputRef}
          violationsCount={result?.violations.length ?? 0}
          filesCount={result?.score?.affectedFiles.length ?? 0}
          prsCount={prs.length}
        />
        <Guide />
      </main>
    </div>
  );
}
