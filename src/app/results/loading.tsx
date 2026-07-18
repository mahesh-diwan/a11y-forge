export default function ResultsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text)", padding: "120px 16px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ width: "160px", height: "20px", background: "var(--surface)", marginBottom: "24px" }} />
        <div style={{ width: "100%", height: "160px", background: "var(--surface)", marginBottom: "24px" }} />
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "32px", background: "var(--surface)" }} />
          <div style={{ flex: 1, height: "32px", background: "var(--surface)" }} />
          <div style={{ flex: 1, height: "32px", background: "var(--surface)" }} />
        </div>
        <div style={{ width: "100%", height: "80px", background: "var(--surface)" }} />
      </div>
    </div>
  );
}
