import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
});


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

    await page.goto("https://irricontrol.zendesk.com/hc/en-us");

    const scrape = await page.extract({
      instruction: `Extract all categories with their titles and links from this HTML. Return an array of objects with keys: title and url.`,
      schema: z.object({
        categories: z.array(
          z.object({
            title: z.string(),
            url: z.string().describe("The url of the category"),
          })
        ),
      }),
    });

    await stagehand.close();

    console.log(JSON.stringify(scrape, null, 2));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 