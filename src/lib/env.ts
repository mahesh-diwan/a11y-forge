export function validateEnv(): void {
  const required = ["GITHUB_TOKEN"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
}
