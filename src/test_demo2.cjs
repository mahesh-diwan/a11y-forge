const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", r => { if (r.status() >= 400) console.log("HTTP ERR:", r.status(), r.url()); });
  page.on("pageerror", err => console.log("PAGE_ERR:", err.message));

  await page.goto("https://a11y-forge.vercel.app", { waitUntil: "networkidle", timeout: 15000 });
  console.log("TITLE:", await page.title());
  const txt = await page.locator("body").innerText();
  console.log("BODY:", txt.substring(0, 200));
  console.log("BTN VISIBLE:", await page.locator('button:has-text("try demo repo")').isVisible());

  await browser.close();
})();
