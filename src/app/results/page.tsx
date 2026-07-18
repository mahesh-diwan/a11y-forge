import { Nav } from "@/components/Nav";
import { ResultsClient } from "@/components/ResultsClient";
import { Footer } from "@/components/Footer";

export default function ResultsPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)", color: "var(--text)" }}>
      <Nav />
      <main id="main-content" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
        <ResultsClient />
      </main>
      <Footer />
    </div>
  );
}
