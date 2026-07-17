import { describe, it, expect } from "vitest";
import { checkLinks } from "@/lib/links";

describe("checkLinks", () => {
  it("passes descriptive link text", () => {
    const v = checkLinks('<a href="/api">API reference</a>', "a.html");
    expect(v.filter((x) => x.type === "vague-link-text")).toHaveLength(0);
  });

  it("flags click here", () => {
    const v = checkLinks('<a href="/go">click here</a>', "a.html");
    expect(v.some((x) => x.type === "vague-link-text")).toBe(true);
  });

  it("flags iframe missing title", () => {
    const v = checkLinks('<iframe src="map.html"></iframe>', "a.html");
    expect(v.some((x) => x.type === "iframe-no-title")).toBe(true);
  });

  it("ignores iframe with title", () => {
    const v = checkLinks('<iframe src="map.html" title="Map"></iframe>', "a.html");
    expect(v.some((x) => x.type === "iframe-no-title")).toBe(false);
  });

  it("flags img with empty alt and real src", () => {
    const v = checkLinks('<img src="chart.png" alt="">', "a.html");
    expect(v.some((x) => x.type === "empty-alt-meaningful-img")).toBe(true);
  });

  it("ignores img with descriptive alt", () => {
    const v = checkLinks('<img src="chart.png" alt="Chart">', "a.html");
    expect(v.some((x) => x.type === "empty-alt-meaningful-img")).toBe(false);
  });
});
