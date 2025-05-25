/** @format */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { supportAgent } from "./agent";
import { components } from "./_generated/api";

export const createThread = action({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (ctx, { prompt, userId }) => {
    const { threadId, thread } = await supportAgent.createThread(ctx, {
      userId,
    });
    const result = await thread.generateText({ prompt });
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
