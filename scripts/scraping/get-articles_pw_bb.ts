/** @format */

import { chromium } from "playwright-core";
import { Browserbase } from "@browserbasehq/sdk";
import dotenv from "dotenv";
import { categories } from "./out/categories";
import fs from "fs";
import path from "path";

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

async function scrapeBooks() {
  const session = await createSession();
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const page = await browser.newPage();

  try {
    type ArticleResult = {
      title?: string;
      url: string;
      blocks: (
        | { type: "header"; level: string; text: string }
        | { type: "text"; text: string }
        | { type: "image"; src: string; alt: string; encoding: "url" }
        | { type: "list"; ordered: boolean; items: string[] }
        | { type: "code"; code: string }
      )[];
      categoryId?: string;
    };
    const results: ArticleResult[] = [];
    // let count = 0;
    let successCount = 0;
    let failureCount = 0;
    const failedArticles = [];

    for (const { id: categoryId, url } of categories) {
      // if (count >= 3) break;

      console.info(`Visiting category: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      const articleLinks = await page.$$eval("a.article-list-link", (links) =>
        links.map((link) => ({
          href: (link as HTMLAnchorElement).href,
          title: (link as HTMLElement).textContent?.trim(),
        }))
      );

      let articleIndex = 0;
      for (const { href, title } of articleLinks) {
        // if (count >= 3) break;
        articleIndex++;
        console.info(
          `Opening article ${articleIndex}/${articleLinks.length} in category: ${title}`
        );
        try {
          await page.goto(href, { waitUntil: "domcontentloaded" });
          await page.waitForSelector(".article-body", { timeout: 5000 });

          // Step 1: Only check for .article-body existence
          try {
            const testResult = await page.evaluate(() => {
              const body = document.querySelector(".article-body");
              return { exists: !!body };
            });
            console.log("article-body existence:", testResult);
          } catch (testErr) {
            console.error("Step 1 evaluate error:", testErr);
            process.exit(1);
          }

          // Restore extraction logic with robust error handling
          let extractionResult;
          try {
            extractionResult = await page.evaluate(() => {
              try {
                const body = document.querySelector(".article-body");
                if (!body) return { blocks: [] };

                const result: (
                  | { type: "header"; level: string; text: string }
                  | { type: "text"; text: string }
                  | { type: "image"; src: string; alt: string; encoding: "url" }
                  | { type: "list"; ordered: boolean; items: string[] }
                  | { type: "code"; code: string }
                )[] = [];

                for (const node of body.children) {
                  const tag = node.tagName.toLowerCase();

                  if (tag === "h1" || tag === "h2" || tag === "h3") {
                    if (
                      "innerText" in node &&
                      typeof (node as HTMLElement).innerText === "string"
                    ) {
                      result.push({
                        type: "header",
                        level: tag,
                        text: (node as HTMLElement).innerText.trim(),
                      });
                    }
                  } else if (tag === "p") {
                    const imgs = node.querySelectorAll("img");
                    imgs.forEach((img) => {
                      if (
                        "src" in img &&
                        typeof (img as HTMLImageElement).src === "string"
                      ) {
                        const image = img as HTMLImageElement;
                        if (!image.src.startsWith("data:")) {
                          result.push({
                            type: "image",
                            src: image.src,
                            alt: image.alt || "",
                            encoding: "url",
                          });
                        }
                      }
                    });
                    if (
                      "innerText" in node &&
                      typeof (node as HTMLElement).innerText === "string"
                    ) {
                      const text = (node as HTMLElement).innerText.trim();
                      if (text) result.push({ type: "text", text });
                    }
                  } else if (tag === "img") {
                    if (
                      "src" in node &&
                      typeof (node as HTMLImageElement).src === "string"
                    ) {
                      const image = node as HTMLImageElement;
                      if (!image.src.startsWith("data:")) {
                        result.push({
                          type: "image",
                          src: image.src,
                          alt: image.alt || "",
                          encoding: "url",
                        });
                      }
                    }
                  } else if (tag === "ul" || tag === "ol") {
                    const items = Array.from(node.querySelectorAll("li"))
                      .map((li) =>
                        "innerText" in li &&
                        typeof (li as HTMLElement).innerText === "string"
                          ? (li as HTMLElement).innerText.trim()
                          : ""
                      )
                      .filter(Boolean);
                    result.push({ type: "list", ordered: tag === "ol", items });
                  } else if (tag === "pre" || tag === "code") {
                    if (
                      "innerText" in node &&
                      typeof (node as HTMLElement).innerText === "string"
                    ) {
                      result.push({
                        type: "code",
                        code: (node as HTMLElement).innerText.trim(),
                      });
                    }
                  }
                }

                return { blocks: result };
              } catch (err) {
                return { error: String(err), blocks: [] };
              }
            });
          } catch (testErr) {
            console.error("Extraction evaluate error:", testErr);
            continue;
          }

          if (extractionResult.error) {
            console.error(
              `Extraction error in article: ${title} (${href}):`,
              extractionResult.error
            );
            continue;
          }

          results.push({
            title,
            url: href,
            blocks: extractionResult.blocks,
            categoryId: categoryId,
          });
          // count++;
          successCount++;
          console.info(`Successfully scraped article: ${title}`);
        } catch (err) {
          failureCount++;
          failedArticles.push({ title, url: href, error: String(err) });
          console.error(`Failed to scrape article: ${title} (${href})`, err);
          continue;
        }
      }
    }
    // Log the total number of articles scraped
    console.log(`Total articles scraped: ${results.length}`);
    // Write results to scripts/scraping/out/articles.json
    const outDir = path.join(process.cwd(), "scripts", "scraping", "out");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "articles.json");
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`Wrote ${results.length} articles to ${outPath}`);
    // Print summary
    console.log("\nScraping summary:");
    console.log(`  Successes: ${successCount}`);
    console.log(`  Failures: ${failureCount}`);
    if (failureCount > 0) {
      console.log("  Failed articles:");
      for (const fail of failedArticles) {
        console.log(`    - ${fail.title} (${fail.url})`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  await browser.close();
}

scrapeBooks();
