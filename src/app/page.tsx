import { Nav } from "@/components/Nav";
import { HomeClient } from "@/components/HomeClient";
import { Guide } from "@/components/Guide";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--canvas)", color: "var(--text)" }}>
      <Nav />
      <main id="main-content" style={{ flex: 1, maxWidth: "720px", margin: "0 auto", padding: "0 16px", width: "100%" }}>
        <HomeClient />
        <Guide />
      </main>
      <Footer />
    </div>
  );
}
