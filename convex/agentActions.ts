import {
  action,
  internalAction,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { supportAgent } from "./agent";
import { components, internal } from "./_generated/api";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { vStreamArgs } from "@convex-dev/agent";
import { getUserId } from "./auth";
import { paginationOptsValidator } from "convex/server";
// import { Id } from "./_generated/dataModel";

export const createThread = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const userId = await getUserId(ctx);

    const threadName = await generateText({
      model: openai.chat("gpt-4o-mini"),
      prompt: `Generate a name for a thread with the following prompt: ${prompt}. don't quote the name.`,
    });
    const { threadId, thread } = await supportAgent.createThread(ctx, {
      userId,
      title: threadName.text,
    });

    return { threadId };
  },
});

// export const continueThread = action({
//   args: { prompt: v.string(), threadId: v.string() },
//   handler: async (ctx, { prompt, threadId }) => {
//     const { thread } = await supportAgent.continueThread(ctx, { threadId });
//     const result = await thread.generateText({ prompt });
//     return { aiMessage: result.text };
//   },
// });

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

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

// export const validateThreadBelongsToUser = ({
//   thread,
//   userId,
// }: {
//   thread: ThreadDoc;
//   userId: Id<"users">;
// }) => {
//   if (thread.userId !== userId)
//     throw new Error(`Thread ${thread._id} does not belong to user ${userId}`);

//   return thread;
// };

export const getAndValidateThread = async (
  ctx: QueryCtx,
  args: {
    threadId: string;
    // userId: string;
  }
) => {
  const thread = await findThread(ctx, { threadId: args.threadId });
  if (!thread) throw new Error(`Thread not found with id ${args.threadId}`);
  // validateThreadBelongsToUser({ thread, userId: args.userId });
  return thread;
};

export const findThread = async (ctx: QueryCtx, args: { threadId: string }) => {
  const thread = await ctx.runQuery(components.agent.threads.getThread, {
    threadId: args.threadId,
  });
  return thread;
};

export const listMessagesForUserThread = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // Make sure the user can view this thread
    // await getAndValidateThread(ctx, {
    //   threadId: args.threadId,
    //   // userId: args.userId
    // });

    // Grab the messages from the thread based on the current page
    const paginated = await supportAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    // I dont want to send the tool results to the client
    // paginated.page = filterOutToolResults(paginated.page);

    // I also want to get the messages that are streaming
    const streams = await supportAgent.syncStreams(ctx, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });

    return { ...paginated, streams };
  },
});

export const sendMessageToThreadFromUser = mutation({
  args: {
    message: v.string(),
    threadId: v.string(),
    // userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Make sure the user can send a message to this thread
    await getAndValidateThread(ctx, {
      threadId: args.threadId,
      // userId: args.userId
    });

    // Push the user message into the database
    const { messageId } = await supportAgent.saveMessage(ctx, {
      threadId: args.threadId,
      prompt: args.message,

      // we need to do this for now otherwise it will try to generate the embeddings
      // immediately which is a fetch in a mutation which is not allowed.
      // We instead generate the embeddings in the streamStory
      skipEmbeddings: true,
    });

    console.log(`messageId`, messageId);
    // Schedule the actual call to the LLM to stream it
    await ctx.scheduler.runAfter(0, internal.agentActions.streamResponse, {
      threadId: args.threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamResponse = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    // Generate the embeddings for the message from the user, this shouldnt be
    // needed in the future
    // await supportAgent.generateAndSaveEmbeddings(ctx, {
    //   messageIds: [promptMessageId],
    // });

    // Start streaming the reponse by line into the database
    const result = await supportAgent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "line",
        },
      }
    );

    await result.consumeStream();
  },
});
