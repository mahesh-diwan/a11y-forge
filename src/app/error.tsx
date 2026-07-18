"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: "48px 24px", maxWidth: "640px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--fail)", margin: "0 0 8px 0" }}>
        ERROR
      </h1>
      <div style={{ width: "48px", height: "3px", background: "var(--fail)", marginBottom: "24px" }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
        {error.message || "Something went wrong."}
      </p>
      {error.digest && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", margin: "0 0 16px 0" }}>
          Ref: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          padding: "8px 16px",
          background: "var(--accent)",
          color: "#000",
          border: "none",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
