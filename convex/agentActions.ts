/** @format */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { supportAgent } from "./agent";
import { api, components } from "./_generated/api";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const createThread = action({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (ctx, { prompt, userId }) => {
    const threadName = await generateText({
      model: openai.chat("gpt-4o-mini"),
      prompt: `Generate a name for a thread with the following prompt: ${prompt}`,
    });
    const { threadId, thread } = await supportAgent.createThread(ctx, {
      userId,
      title: threadName.text,
    });
    const enrichBlocksArticleData = await ctx.runAction(
      api.blocks.getBlocksByVectorSearch,
      {
        query: prompt,
      }
    );
    const finalPrompt: string = `Here are some useful informations that you may or may not use: 
    ${JSON.stringify(enrichBlocksArticleData)} 
    ===================
    The user asked: ${prompt}
    `;
    const result = await thread.generateText({ prompt: finalPrompt });
    return { threadId, aiMessage: result.text };
  },
});

export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ prompt });
    return { aiMessage: result.text };
  },
});

export const listThreads = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      order: "desc",
      paginationOpts: { cursor: null, numItems: 20 },
    });
  },
});

export const listMessages = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId,
        order: "asc",
        paginationOpts: { cursor: null, numItems: 50 },
      }
    );
  },
});

export const deleteThread = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });
  },
});