import { describe, it, expect } from "vitest";
import { parseGithubUrl } from "@/lib/github";

describe("parseGithubUrl", () => {
  it("parses standard URL", () => {
    const r = parseGithubUrl("https://github.com/owner/repo");
    expect(r).toEqual({ owner: "owner", repo: "repo" });
  });

  it("handles trailing .git", () => {
    const r = parseGithubUrl("https://github.com/owner/repo.git");
    expect(r).toEqual({ owner: "owner", repo: "repo" });
  });

  it("handles trailing slash", () => {
    const r = parseGithubUrl("https://github.com/owner/repo/");
    expect(r).toEqual({ owner: "owner", repo: "repo" });
  });

  it("returns null for non-github URL", () => {
    expect(parseGithubUrl("https://gitlab.com/owner/repo")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseGithubUrl("not a url")).toBeNull();
  });

  it("handles subdomain urls", () => {
    const r = parseGithubUrl("https://github.com/owner-name/repo-name");
    expect(r?.owner).toBe("owner-name");
    expect(r?.repo).toBe("repo-name");
  });
});
