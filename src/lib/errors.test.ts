import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  GitHubError,
  errorId,
  isAppError,
} from "./errors";

describe("AppError", () => {
  it("carries code/status/safeMessage/errorId", () => {
    const e = new ValidationError("bad url");
    expect(e.code).toBe("VALIDATION_ERROR");
    expect(e.status).toBe(400);
    expect(e.safeMessage).toBe("bad url");
    expect(typeof e.errorId).toBe("string");
    expect(e.errorId.length).toBeGreaterThan(0);
  });
  it("GitHubError maps to 502", () => {
    const e = new GitHubError("api down");
    expect(e.status).toBe(502);
    expect(e.code).toBe("GITHUB_ERROR");
  });
  it("isAppError narrows", () => {
    expect(isAppError(new ValidationError("x"))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });
  it("errorId unique", () => {
    expect(errorId()).not.toBe(errorId());
  });
});
