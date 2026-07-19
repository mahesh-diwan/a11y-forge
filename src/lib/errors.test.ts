import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  RateLimitError,
  GitHubError,
  OpenAIError,
  ScanError,
  ConfigError,
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

describe("OpenAIError", () => {
  it("maps to 502 with default message", () => {
    const e = new OpenAIError();
    expect(e.status).toBe(502);
    expect(e.code).toBe("OPENAI_ERROR");
    expect(e.safeMessage).toBe("AI fix generation failed");
  });
  it("accepts details and cause", () => {
    const cause = new Error("rate limited");
    const e = new OpenAIError("OpenAI quota exceeded", { retryAfter: 30 }, cause);
    expect(e.details).toEqual({ retryAfter: 30 });
    expect((e as any).cause).toBe(cause);
  });
});

describe("ScanError", () => {
  it("maps to 500 with default message", () => {
    const e = new ScanError();
    expect(e.status).toBe(500);
    expect(e.code).toBe("SCAN_FAILED");
    expect(e.safeMessage).toBe("Scan failed");
  });
  it("accepts details and cause", () => {
    const e = new ScanError("timeout scanning repo", { repo: "a/b" }, new Error("timeout"));
    expect(e.details).toEqual({ repo: "a/b" });
    expect(e.safeMessage).toBe("timeout scanning repo");
  });
});

describe("RateLimitError", () => {
  it("maps to 429 with default message", () => {
    const e = new RateLimitError();
    expect(e.status).toBe(429);
    expect(e.code).toBe("RATE_LIMITED");
    expect(e.safeMessage).toBe("Too many requests. Try again later.");
  });
});

describe("ConfigError", () => {
  it("maps to 500 with custom message", () => {
    const e = new ConfigError("Missing GITHUB_TOKEN");
    expect(e.status).toBe(500);
    expect(e.code).toBe("CONFIG_ERROR");
    expect(e.safeMessage).toBe("Missing GITHUB_TOKEN");
  });
});

describe("safeMessage filtering", () => {
  it("safeMessage does not leak internal details", () => {
    const e = new GitHubError("GitHub error", { internal: "api-key-123" });
    expect(e.safeMessage).not.toContain("api-key-123");
    expect(e.safeMessage).toBe("GitHub error");
  });
});
