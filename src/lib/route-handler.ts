import { NextRequest, NextResponse } from "next/server";
import { AppError, isAppError } from "./errors";
import { logRequest } from "./logger";

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(handler: Handler): Handler {
  return async (req: NextRequest) => {
    const start = Date.now();
    const route = req.nextUrl.pathname;
    try {
      const res = await handler(req);
      logRequest(route, res.status, Date.now() - start);
      return res;
    } catch (err) {
      const appErr = isAppError(err)
        ? err
        : new AppError({
            code: "INTERNAL_ERROR",
            status: 500,
            safeMessage: "Unexpected error",
            details: String(err),
            cause: err,
          });
      // Sentry (optional). Guarded import avoids hard dep when DSN unset.
      try {
        const { captureException } = await import("./sentry");
        captureException(err, { tags: { route, errorId: appErr.errorId } });
      } catch {
        /* sentry optional */
      }
      logRequest(route, appErr.status, Date.now() - start, {
        code: appErr.code,
        errorId: appErr.errorId,
      });
      return NextResponse.json(
        {
          error: {
            code: appErr.code,
            message: appErr.safeMessage,
            errorId: appErr.errorId,
          },
        },
        { status: appErr.status },
      );
    }
  };
}
