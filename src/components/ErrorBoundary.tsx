"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    import("@/lib/sentry")
      .then(({ captureException }) =>
        captureException(error, { tags: { boundary: "main" } }),
      )
      .catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="mx-auto max-w-md p-8 text-center">
            <h2
              style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--fail)" }}
            >
              Something broke.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {this.state.message || "An unexpected error occurred. Try again."}
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
