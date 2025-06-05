/** @format */

// "use node";
import { action } from "./_generated/server";
// import { v } from "convex/values";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, LanguageModelV1 } from "ai";
import { z } from "zod";
import { zCustomAction } from "convex-helpers/server/zod";
import { NoOp } from "convex-helpers/server/customFunctions";

const zArgs = {
  imageUrl: z.string(),
  context: z.string().optional(),
  articleTitle: z.string().optional(),
};

const responseSchema = z.object({
  summary: z
    .string()
    .describe("A concise technical description of the image")
    .optional(),
  error: z
    .string()
    .describe("An error message if the image could not be analyzed")
    .optional(),
});

export const analyzeImageWithContext = zCustomAction(
  action,
  NoOp
)({
  args: zArgs,
  returns: responseSchema,
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    const openai = createOpenAI({ apiKey });
    const model: LanguageModelV1 = openai.chat("gpt-4.1-mini");

    const systemPrompt = `You are a technical documentation specialist. Your task is to analyze images from technical documentation articles and provide clear, concise descriptions focused on installation and operational aspects.
    Keep descriptions factual and based only on what is visually present in the image.
    If you see highlighted areas, highlight this in the text as well, because most likely the engeneere made the picture to show us specifically what is highlighted. 
    Consider the iamge size, if it is small, it is probably a detail, an icon, a button. In this case just say what is is: EX: this looks like the delete button. Don't make assumptions about things that are not in the image.
    Don't say a lot of words, for small images.
    pay attention to the labeled lements in the picture, if there are any. 
    `;

    const userMessage = `Please analyze this image from a technical documentation article${args.articleTitle ? ` titled \"${args.articleTitle}\"` : ""}${args.context ? `\n\nContext: ${args.context}` : ""}.

Provide a concise technical description of the image. Don't make assumptions about things that are not in the image if there is not a lot say about it say wahat you can`;

    // Use generateObject for structured output
    const { object } = await generateObject({
      model,
      schema: responseSchema,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage,
            },
            {
              type: "image",
              image: args.imageUrl,
            },
          ],
        },
      ],
    });

    return object;
  },
});
