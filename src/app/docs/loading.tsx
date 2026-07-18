export default function DocsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text)", padding: "120px 16px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ width: "120px", height: "20px", background: "var(--surface)", marginBottom: "24px" }} />
        <div style={{ width: "100%", height: "120px", background: "var(--surface)", marginBottom: "24px" }} />
        <div style={{ width: "100%", height: "200px", background: "var(--surface)", marginBottom: "24px" }} />
        <div style={{ width: "80%", height: "16px", background: "var(--surface)", marginBottom: "8px" }} />
        <div style={{ width: "60%", height: "16px", background: "var(--surface)" }} />
      </div>
    </div>
  );
}
