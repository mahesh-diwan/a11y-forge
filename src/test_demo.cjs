const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on("console", msg => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", err => console.log("PAGE_ERR:", err.message));

  await page.goto("https://a11y-forge.vercel.app", { waitUntil: "networkidle" });
  console.log("HOME LOADED");

  const btn = page.locator('button:has-text("try demo repo")');
  console.log("BTN VISIBLE:", await btn.isVisible());
  await btn.click();
  console.log("CLICKED");

  await new Promise(r => setTimeout(r, 3000));

  console.log("URL AFTER 3s:", page.url());
  const content = await page.locator("body").innerText();
  console.log("PAGE TEXT (first 300):", content.slice(0, 300));

  await browser.close();
})();
