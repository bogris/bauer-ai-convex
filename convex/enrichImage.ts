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
    const model: LanguageModelV1 = openai.chat("gpt-4o");

    const systemPrompt = `You are a technical documentation specialist. Your task is to analyze images from technical documentation articles and provide clear, concise descriptions focused on installation and operational aspects.
    Keep descriptions factual and based only on what is visually present in the image.`;

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
