/** @format */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertBlockEmbedding = mutation({
  args: v.object({
    id: v.optional(v.id("embeddings")),
    blockId: v.id("blocks"),
    embedding: v.array(v.float64()),
  }),
  handler: async (ctx, args) => {
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (existing) {
        await ctx.db.patch(args.id, { embedding: args.embedding });
      }
    }
    const newId = await ctx.db.insert("embeddings", {
      type: "block",
      embedding: args.embedding,
      blockId: args.blockId,
    });
    return newId;
  },
});

export const getBlockEmbedding = query({
  args: {
    id: v.id("blocks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embeddings")
      .withIndex("by_block_id", (q) => q.eq("blockId", args.id))
      .first();
  },
});

// export const getBlockEmbedding = query({
//   args: {
//     blockId: v.id("blocks"),
//   },
//   returns: v.array(v.float64()),
//   handler: async (ctx, args) => {
//     const embedding = await ctx.db
//       .query("embeddings")
//       .withIndex("by_block_id", (q) => q.eq("blockId", args.blockId))
//       .unique();
//     return embedding?.embedding ?? [];
//   },
// });
