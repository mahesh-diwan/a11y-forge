import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (dsn && typeof window === "undefined") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? "development",
  });
}

export function captureException(
  err: unknown,
  opts?: { tags?: Record<string, string> },
): void {
  if (!dsn) return;
  Sentry.captureException(err, opts);
}
export { Sentry };
