import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});


const targetUrl = "https://irricontrol.zendesk.com/hc/en-us";

async function scrapeBooks() {
  const browser = await chromium.launch(); // no Browserbase
  const page = await browser.newPage();
  await page.goto(targetUrl);
  
  try {
    await page.goto(targetUrl);
    await page.waitForTimeout(10000);
    console.log("page is: ", await page.content());
    console.log(await page.title());

    // Extract category URLs and names
    const categories = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/hc/en-us/categories/"]')).map(link => ({
        name: link?.textContent?.trim(),
        // @ts-expect-error:idk
        url: link?.href,
      }));
    });

    console.log("Categories:", categories);
    await browser.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

scrapeBooks();
