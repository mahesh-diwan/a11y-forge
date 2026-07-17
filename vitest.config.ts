import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(root, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/errors.ts",
        "src/lib/**/coalesce.ts",
        "src/lib/**/env.ts",
        "src/lib/**/route-handler.ts",
        "src/lib/**/request-guard.ts",
        "src/lib/**/validation.ts",
        "src/lib/**/security-headers.ts",
        "src/lib/**/rate-limit.ts",
        "src/lib/**/logger.ts",
        "src/lib/**/sentry.ts",
        "src/lib/**/scanner.ts",
        "src/lib/**/cache.ts",
        "src/app/api/**/route.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      thresholds: { lines: 80, functions: 75, branches: 70 },
    },
  },
});
