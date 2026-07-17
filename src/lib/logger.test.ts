import { describe, it, expect, vi } from "vitest";
import { logRequest, logError } from "./logger";

describe("logger", () => {
  it("logRequest emits JSON with fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logRequest("/api/scan", 200, 12, { errorId: "e1" });
    const out = JSON.parse(spy.mock.calls[0][0] as string);
    expect(out.route).toBe("/api/scan");
    expect(out.status).toBe(200);
    expect(out.ms).toBe(12);
    expect(out.errorId).toBe("e1");
    expect(out.level).toBe("info");
    spy.mockRestore();
  });
  it("logError emits level error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("e2", new Error("boom"));
    const out = JSON.parse(spy.mock.calls[0][0] as string);
    expect(out.level).toBe("error");
    expect(out.errorId).toBe("e2");
    spy.mockRestore();
  });
});
