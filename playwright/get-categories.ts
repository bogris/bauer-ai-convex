console.info("Launching browser...");
const browser = await window.playwright.chromium.connectOverCDP(window.connectionString);
console.info("Connected!");

const page = await browser.newPage();
await page.goto('https://irricontrol.zendesk.com/hc/en-us', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

// Extract category URLs and names
const categories = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a[href*="/hc/en-us/categories/"]')).map(link => ({
    name: link.textContent.trim(),
    url: link.href
  }));
});

console.log("Categories:", categories);
await browser.close();
