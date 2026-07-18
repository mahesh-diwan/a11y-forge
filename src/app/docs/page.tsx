import { Nav } from "@/components/Nav";
import { Docs } from "@/components/Docs";
import { Footer } from "@/components/Footer";

export default function DocsPage() {
  return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "var(--canvas)",
          color: "var(--text)",
        }}
      >
        <Nav />
        <main
          id="main-content"
          style={{ flex: 1, maxWidth: "720px", margin: "0 auto", padding: "0 16px", width: "100%" }}
        >
          <Docs />
        </main>
        <Footer />
      </div>
  );
}
