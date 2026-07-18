import { Octokit } from "octokit";
import { cacheGet, cacheSet } from "./cache";

let _octokit: Octokit | null = null;
let _token: string | undefined;

/**
 * Get or create a singleton Octokit instance.
 *
 * Why: Reuses Octokit across calls to avoid redundant auth setup. Re-creates
 * only when token changes, supporting both public (no token) and private repos.
 *
 * @param token - Optional GitHub personal access token for authenticated requests.
 * @returns Configured Octokit instance.
 */
export function getOctokit(token?: string): Octokit {
  if (!_octokit || token !== _token) {
    _octokit = new Octokit({ auth: token });
    _token = token;
  }
  return _octokit;
}

/**
 * Parse GitHub repo URL into owner and repo name.
 *
 * Why: Normalizes various GitHub URL formats (with/without .git suffix, trailing
 * slashes, query params) into consistent owner/repo pair used by Octokit API.
 *
 * @param url - GitHub URL (e.g. "https://github.com/owner/repo.git").
 * @returns Owner/repo object, or null if URL does not match GitHub pattern.
 */
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const clean = url.replace(/\.git$/, "").split("?")[0].split("#")[0];
  const match = clean.match(/github\.(?:com|work)\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?)\/([a-zA-Z0-9_.-]{1,100})/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch file content from a GitHub repo.
 *
 * Why: GitHub API returns file contents as base64-encoded JSON. This function
 * decodes the response into a UTF-8 string for scanning. Returns empty string
 * if path is a directory or does not exist.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repo owner (user or org).
 * @param repo - Repo name.
 * @param path - File path within the repo.
 * @returns Decoded file content as UTF-8 string.
 */
export async function fetchFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  opts?: { bypassCache?: boolean }
): Promise<string> {
  const key = `${owner}/${repo}/${path}`;
  if (!opts?.bypassCache) {
    const cached = cacheGet(key);
    if (typeof cached === "string") return cached;
  }

  const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
  if ("content" in data && !Array.isArray(data)) {
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    cacheSet(key, content);
    return content;
  }
  return "";
}
