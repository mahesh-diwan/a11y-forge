import { describe, it, expect, afterEach } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const saved = process.env.GITHUB_TOKEN;

  afterEach(() => {
    if (saved === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = saved;
  });

  it("passes when GITHUB_TOKEN present", () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    expect(() => validateEnv()).not.toThrow();
  });

  it("throws when GITHUB_TOKEN missing", () => {
    delete process.env.GITHUB_TOKEN;
    expect(() => validateEnv()).toThrow(/Missing required env: GITHUB_TOKEN/);
  });
});
