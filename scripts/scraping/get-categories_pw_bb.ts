import { chromium } from "playwright-core";
import { Browserbase } from "@browserbasehq/sdk";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

async function createSession() {
  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  return session;
}

const targetUrl = "https://irricontrol.zendesk.com/hc/en-us";

async function scrapeBooks() {
  const session = await createSession();
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = await browser.newPage();
  
  try {
    await page.goto(targetUrl);
    await page.waitForTimeout(1000);

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
