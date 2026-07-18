import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";
import { ResultsProvider } from "@/lib/ResultsContext";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "a11y-forge — autonomous accessibility fixes",
  description: "Paste a GitHub repo. Get pull requests with WCAG fixes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`}>
      <body className="antialiased">
        <ResultsProvider>
          <a
            href="#main-content"
            className="fixed -left-[9999px] top-0 z-[100] bg-[var(--accent)] px-4 py-2 font-mono text-sm text-[#000] opacity-0 focus:left-0 focus:opacity-100"
          >
            Skip to content
          </a>
          {children}
        </ResultsProvider>
      </body>
    </html>
  );
}
