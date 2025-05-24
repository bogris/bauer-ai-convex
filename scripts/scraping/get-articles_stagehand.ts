/** @format */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const articleUrls = [
  // Add your article URLs here
  "https://irricontrol.zendesk.com/hc/en-us/articles/27640523788315-Getting-to-Know-the-Commands-of-the-Irricontrol-Platform",
  // ...
];

async function main() {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    verbose: 0,
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    modelName: "gpt-4o-mini",
  });

  try {
    await stagehand.init();
    const page = stagehand.page;
    const results = [];
    let count = 0;

    for (const url of articleUrls) {
      await page.goto(url);

      const scrape = await page.extract({
        instruction: `Extract the following from the main article content:
- The article title (as 'title').
- All headers (as blocks with type 'header', level: h1/h2/h3, and text).
- All text blocks (as blocks with type 'text' and text).
- All images (as blocks with type 'image', src, alt, and encoding: 'base64' if src is a data URI, otherwise 'url').
- All lists (as blocks with type 'list', ordered: true/false, and items: string[]).
- All code blocks (as blocks with type 'code' and code).
- Also, return a base64Images array with objects { refId, src, alt } for any base64 images found in the article.
Return an object with title, blocks (array), and base64Images (array, if any).`,
        schema: z.object({
          title: z.string(),
          blocks: z.array(
            z.union([
              z.object({
                type: z.literal("header"),
                level: z.string(),
                text: z.string(),
              }),
              z.object({ type: z.literal("text"), text: z.string() }),
              z.object({
                type: z.literal("image"),
                src: z.string(),
                alt: z.string().optional(),
                encoding: z.string().optional(),
              }),
              z.object({
                type: z.literal("list"),
                ordered: z.boolean(),
                items: z.array(z.string()),
              }),
              z.object({ type: z.literal("code"), code: z.string() }),
            ])
          ),
          base64Images: z
            .array(
              z.object({
                refId: z.string(),
                src: z.string(),
                alt: z.string().optional(),
              })
            )
            .optional(),
        }),
      });

      results.push({ url, ...scrape });
      count++;
      if (count >= 2) break;
    }

    await stagehand.close();
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
