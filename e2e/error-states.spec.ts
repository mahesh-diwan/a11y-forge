import { test, expect } from "@playwright/test";

test("invalid repo url shows error banner", async ({ page }) => {
  await page.goto("/");

  const input = page.getByLabel("GitHub repository URL");
  await input.fill("not-a-url");

  await page.getByRole("button", { name: /run/i }).click();

  const alert = page.getByRole("alert").first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
});
