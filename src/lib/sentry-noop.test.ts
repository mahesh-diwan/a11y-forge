import { describe, it, expect } from "vitest";
import { captureException } from "./sentry";

describe("sentry no-op", () => {
  it("does not throw when SENTRY_DSN unset", () => {
    expect(() => captureException(new Error("boom"), { tags: { r: "1" } })).not.toThrow();
  });
});
