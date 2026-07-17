import { test, expect } from "@playwright/test";

test("respects reduced motion: hero canvas disabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const canvas = page.locator("#forge canvas");
  await expect(canvas).toHaveCount(0);
});
