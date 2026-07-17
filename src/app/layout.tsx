import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "equity — automated accessibility",
  description: "Automated WCAG compliance fixing with Codex + GPT-5.6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="fixed -left-[9999px] top-0 z-[100] rounded-b-md bg-[var(--color-pass)] px-4 py-2 font-mono text-sm text-[#1a1717] opacity-0 focus:left-0 focus:opacity-100 focus:outline-2 focus:outline-[var(--color-focus)]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
