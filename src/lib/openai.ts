import type OpenAI from "openai";

let _openai: OpenAI | null = null;

/**
 * Get singleton OpenAI client instance.
 *
 * Why: Lazy-loads OpenAI SDK and caches instance for reuse. Throws early
 * if OPENAI_API_KEY env var is missing, providing clear error message
 * instead of cryptic API 401 later. Uses dynamic import to keep bundle
 * size small when AI features are unused.
 *
 * @returns Configured OpenAI client.
 * @throws If OPENAI_API_KEY environment variable is not set.
 */
export async function getOpenAI(): Promise<OpenAI> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  if (!_openai) {
    const mod = await import("openai");
    _openai = new mod.default({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}
