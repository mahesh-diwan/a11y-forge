const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on("console", msg => {
    if (msg.type() === "error") console.log("CONSOLE_ERR:", msg.text().slice(0, 200));
  });
  page.on("pageerror", err => console.log("PAGE_ERR:", err.message));

  await page.goto("https://a11y-forge.vercel.app", { waitUntil: "networkidle" });
  console.log("HOME LOADED");

  // Fill repo URL
  const input = page.locator('input[aria-label="GitHub repository URL"]');
  await input.fill("https://github.com/mahesh-diwan/News3");
  console.log("URL FILLED");

  await new Promise(r => setTimeout(r, 500));

  // Click scan
  await page.locator('button:has-text("Scan")').click();
  console.log("SCAN CLICKED");

  // Wait for scan to complete (phase changes to "done" or URL changes)
  try {
    await page.waitForURL("**/results**", { timeout: 120000 });
    console.log("NAVIGATED TO /results");
  } catch {
    console.log("URL after timeout:", page.url());
    const body = await page.locator("body").innerText();
    console.log("BODY:", body.substring(0, 500));
    await browser.close();
    return;
  }

  await new Promise(r => setTimeout(r, 2000));
  const body = await page.locator("body").innerText();
  console.log("RESULTS BODY:", body.substring(0, 800));

  await browser.close();
})();
