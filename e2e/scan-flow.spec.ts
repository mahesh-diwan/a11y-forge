import { test, expect } from "@playwright/test";

test("submitting repo url triggers scan and shows feedback", async ({ page }) => {
  await page.goto("/");

  const input = page.getByLabel("GitHub repository URL");
  await expect(input).toBeVisible();
  await input.fill("https://github.com/owner/repo");

  await page.getByRole("button", { name: /scan/i }).click();

  await expect(async () => {
    const feedback =
      (await input.isDisabled()) || (await page.getByRole("alert").count()) > 0;
    expect(feedback).toBeTruthy();
  }).toPass({ timeout: 8_000 });
});
