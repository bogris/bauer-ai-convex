/** @format */

import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { api, components } from "./_generated/api";
import { z } from "zod";
import { Doc } from "./_generated/dataModel";
// import { tool } from "ai";

export const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4.1-mini"),
  instructions: `You are a helpful assistant for Bauer irrigation equipment. You have a tool to search documentation
  You will always use the tool to search documentation in order to provide accurate answers.
  if the tool doese not offer relevant results, give it your best shot, but signal this to the user that the docs were inaccurate. 
  if the user asks for a "screen" this should be the image in a block. Check aiSummary for the image blocks to match it
  try to respond in the language of the inital question. 
  Please also include URL of the article and mention the section where the info is found. 

  Try to include the relevant steps if a task requires more then one. 
  Include image URLs in the response to better explain the answer. 
  `,
  textEmbedding: openai.embedding("text-embedding-3-small"),
  maxSteps: 10,
  tools: {
    seachDocumentation: createTool({
      args: z.object({
        searchQuery: z
          .string()
          .describe("The query to search for in the documentation"),
      }),
      description:
        "Search documentation. Please provide a query translated in english for this tool",
      handler: async (ctx, args) => {
        console.log("searchQuery", args.searchQuery);
        const { articles } = (await ctx.runAction(
          api.blocks.getBlocksByVectorSearch,
          {
            query: args.searchQuery,
          }
        )) as {
          blocks: Doc<"blocks">[];
          articles: Doc<"articles">[];
        };

        return {
          content: `${JSON.stringify(articles[0])}  `,
        };
      },
    }),
  },
  // Optionally add tools, contextOptions, etc.
});
