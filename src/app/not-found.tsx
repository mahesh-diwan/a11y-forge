import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ padding: "48px 24px", maxWidth: "640px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--accent)", margin: "0 0 8px 0" }}>
        404
      </h1>
      <div style={{ width: "48px", height: "3px", background: "var(--accent)", marginBottom: "24px" }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
        Page not found.
      </p>
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          padding: "8px 16px",
          background: "var(--accent)",
          color: "#000",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Home
      </Link>
    </main>
  );
}
