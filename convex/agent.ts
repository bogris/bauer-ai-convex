/** @format */

import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";

export const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  instructions: "You are a helpful assistant.",
  textEmbedding: openai.embedding("text-embedding-3-small"),
  // Optionally add tools, contextOptions, etc.
});
