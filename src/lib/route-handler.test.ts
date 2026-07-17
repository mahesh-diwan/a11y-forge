import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "./route-handler";
import { ValidationError, AppError } from "./errors";

describe("withErrorHandler", () => {
  it("returns handler response on success", async () => {
    const handler = withErrorHandler(async () => NextResponse.json({ ok: true }));
    const res = await handler(new NextRequest("http://localhost/x"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("wraps thrown AppError into error envelope", async () => {
    const handler = withErrorHandler(async () => {
      throw new ValidationError("bad input");
    });
    const res = await handler(new NextRequest("http://localhost/x"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("bad input");
    expect(typeof body.error.errorId).toBe("string");
  });

  it("wraps unknown errors into INTERNAL_ERROR", async () => {
    const handler = withErrorHandler(async () => {
      throw new Error("boom");
    });
    const res = await handler(new NextRequest("http://localhost/x"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.errorId).toBeDefined();
  });

  it("preserves errorId from AppError", async () => {
    const err = new AppError({
      code: "CUSTOM",
      status: 418,
      safeMessage: "teapot",
    });
    const handler = withErrorHandler(async () => {
      throw err;
    });
    const res = await handler(new NextRequest("http://localhost/x"));
    const body = await res.json();
    expect(body.error.errorId).toBe(err.errorId);
  });
});
