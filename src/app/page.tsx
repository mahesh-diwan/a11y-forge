import { Nav } from "@/components/Nav";
import { HomeClient } from "@/components/HomeClient";
import { Guide } from "@/components/Guide";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)", color: "var(--text)" }}>
      <Nav />
      <main id="main-content" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
        <HomeClient />
        <Guide />
      </main>
      <Footer />
    </div>
  );
}
