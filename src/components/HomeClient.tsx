"use client";

import { useRef, FormEvent } from "react";
import { useResults } from "@/lib/ResultsContext";
import { Hero } from "@/components/Hero";

export function HomeClient() {
  const { repoUrl, setRepoUrl, phase, error, result, prs, scan, cancel, demo, setError } = useResults();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl) return;
    if (!/github\.com\/[^\/]+\/[^\/\s]+/.test(repoUrl)) {
      setError("Enter a valid GitHub repo URL (https://github.com/owner/repo).");
      return;
    }
    scan(repoUrl);
  }

  return (
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
  );
}
