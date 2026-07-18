import { Nav } from "@/components/Nav";
import { Docs } from "@/components/Docs";
import { Footer } from "@/components/Footer";

export default function DocsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        color: "var(--text)",
      }}
    >
      <Nav />
      <main
        id="main-content"
        style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}
      >
        <Docs />
      </main>
      <Footer />
    </div>
  );
}
