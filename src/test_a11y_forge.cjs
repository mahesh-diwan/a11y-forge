const { chromium } = require("playwright");

const BASE = "https://a11y-forge.vercel.app";

async function check(label, ok, detail) {
  const sym = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`${sym} ${label}${detail ? " \u2014 " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 1. Homepage
  await page.goto(BASE, { waitUntil: "networkidle" });
  await check("homepage title", (await page.title()) === "a11y-forge \u2014 autonomous accessibility fixes");
  await check("scan form", await page.locator('input[aria-label="GitHub repository URL"]').isVisible());
  await check("scan button", await page.locator('button:has-text("Scan")').isVisible());
  await check("demo button", await page.locator('text=try demo repo').isVisible());
  await check("how it works", await page.locator('h2:has-text("HOW IT WORKS")').isVisible());
  const steps = await page.locator('h2:has-text("HOW IT WORKS") ~ ol li').count();
  await check("4 pipeline steps", steps === 4, String(steps));
  await check("footer", await page.locator('footer:has-text("autonomous WCAG fixer")').isVisible());

  // 2. Docs page
  await page.click('a[href="/docs"]');
  await page.waitForURL("**/docs");
  await page.waitForLoadState("networkidle");
  await check("docs h1", await page.locator('h1:has-text("DOCS")').isVisible());
  await check("pipeline label", await page.locator('h2:has-text("Pipeline")').isVisible());
  await check("sequence label", await page.locator('h2:has-text("Sequence")').isVisible());
  await check("submit URL step", await page.locator('text=Submit URL').first().isVisible());
  await check("prioritize step", await page.locator('text=Prioritize').first().isVisible());
  await check("create PRs step", await page.locator('text=Create PRs').first().isVisible());

  // 3. Results empty state
  await page.goto(BASE + "/results", { waitUntil: "networkidle" });
  await check("results empty", await page.locator("text=No results yet").isVisible());
  await check("scan prompt", await page.locator("text=Scan a repo").isVisible());

  // 4. Demo click
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.click("text=try demo repo");
  let demoOk = false;
  try {
    await page.waitForURL("**/results**", { timeout: 5000 });
    demoOk = true;
  } catch {}
  await check("demo navigates to /results", demoOk, page.url());

  // 5. No hidden suspense artifacts
  await check("no hidden suspense", await page.locator('div[hidden][id^="S:"]').count() === 0);

  // 6. A11y basics
  await check("skip link", await page.locator('text=Skip to content').isVisible());
  await check("nav aria-label", await page.locator('nav[aria-label="Primary"]').isVisible());

  await browser.close();
  console.log("\nDone.", process.exitCode ? "FAILURES" : "ALL PASS");
})();
