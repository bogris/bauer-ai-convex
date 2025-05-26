/** @format */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";


export const getImageBlockContext = query({
  args: {
    blockId: v.id("blocks"),
  },
  returns: v.object({
    previousTexts: v.array(v.string()),
    articleTitle: v.optional(v.string()),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error("Block not found");
    if (block.type !== "image") throw new Error("Block is not an image");
    const articleId = block.articleId;
    // Get all blocks for this article, sorted by insertion order
    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_article_id", (q) => q.eq("articleId", articleId))
      .collect();
    // Find the index of the current image block
    const idx = allBlocks.findIndex((b) => b._id === args.blockId);
    if (idx === -1) throw new Error("Block not found in article");
    // Get previous 3 non-image blocks
    const previousTexts: string[] = [];
    for (let i = idx - 1; i >= 0 && previousTexts.length < 3; i--) {
      const b = allBlocks[i];
      if (b.type !== "image") {
        if (b.type === "header" || b.type === "text") {
          previousTexts.push(b.text);
        } else if (b.type === "list") {
          previousTexts.push(b.items.join("\n"));
        } else if (b.type === "code") {
          previousTexts.push(b.code);
        }
      }
    }
    previousTexts.reverse(); // Oldest to newest
    // Get article title
    const article = await ctx.db.get(articleId);
    const articleTitle = article?.title;
    // Get image url
    const imageUrl = block.src;
    return {
      previousTexts,
      articleTitle,
      imageUrl,
    };
  },
});

export const addAiSummary = mutation({
  args: {
    blockId: v.id("blocks"),
    aiSummary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, { aiSummary: args.aiSummary });
  },
});

export const blocksNoEmbeddingValidator = v.object({
  _id: v.id("blocks"),
  _creationTime: v.number(),
  type: v.string(),
  text: v.optional(v.string()),
  items: v.optional(v.array(v.string())),
  code: v.optional(v.string()),
  src: v.optional(v.string()),
  alt: v.optional(v.string()),
  encoding: v.optional(v.string()),
  aiSummary: v.optional(v.string()),
  articleId: v.id("articles"),
  ordered: v.optional(v.boolean()),
});
export const getArticleBlocks = query({
  args: {
    articleId: v.id("articles"),
  },
  returns: v.array(blocksNoEmbeddingValidator),
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_article_id", (q) => q.eq("articleId", args.articleId))
      .collect();
    return blocks.map((b) => {
      delete b.embedding;
      return b;
    });
  },
});

export const getBlocksByType = query({
  args: {
    type: v.union(
      v.literal("header"),
      v.literal("text"),
      v.literal("image"),
      v.literal("list"),
      v.literal("code")
    ),
  },
  returns: v.array(blocksNoEmbeddingValidator),
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    return blocks.map((b) => {
      delete b.embedding;
      return b;
    });
  },
});

export const enrichImageBlocks = action({
  args: {
    articleId: v.optional(v.id("articles")),
    allBlocks: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let blocks: DataModel["blocks"]["document"][] = [];
    if (args.articleId) {
      const article = await ctx.runQuery(api.blocks.getArticleBlocks, {
        articleId: args.articleId,
      });
      if (!article) throw new Error("Article not found");
      const blocksResponse = await ctx.runQuery(api.blocks.getArticleBlocks, {
        articleId: args.articleId,
      });
      if (!blocksResponse) throw new Error("Blocks not found");
      blocks = blocksResponse;
    } else if (args.allBlocks) {
      const blocksResponse = await ctx.runQuery(api.blocks.getBlocksByType, {
        type: "image",
      });
      if (!blocksResponse) throw new Error("Blocks not found");
      blocks = blocksResponse;
      for (const block of blocks) {
        if (block.type === "image") {
          blocks.push(block);
        }
      }
    }
    for (const block of blocks.slice(0, args.limit)) {
      if (block.type === "image") {
        const imageBlock = block;
        const imageBlockContext = await ctx.runQuery(
          api.blocks.getImageBlockContext,
          {
            blockId: imageBlock._id,
          }
        );
        if (!imageBlockContext)
          throw new Error("Image block context not found");
        const aiSummaryResponse = await ctx.runAction(
          api.enrichImage.analyzeImageWithContext,
          {
            articleTitle: imageBlockContext.articleTitle,
            imageUrl: imageBlock.src,
            context: imageBlockContext.previousTexts.join("\n"),
          }
        );
        const aiSummary = aiSummaryResponse.summary;
        if (!aiSummary) throw new Error("AI summary not found");
        await ctx.runMutation(api.blocks.addAiSummary, {
          blockId: imageBlock._id,
          aiSummary,
        });
      }
    }
  },
});

export const setBlockEmbedding = mutation({
  args: {
    blockId: v.id("blocks"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, { embedding: args.embedding });
    return null;
  },
});

export const getBlockEmbedding = query({
  args: {
    blockId: v.id("blocks"),
  },
  returns: v.array(v.float64()),
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    return block?.embedding ?? [];
  },
});

export const generateEmbeddingsForArticleBlocks = action({
  args: {
    articleId: v.id("articles"),
    overwrite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Fetch all blocks for the article
    const blocks = await ctx.runQuery(api.blocks.getArticleBlocks, {
      articleId: args.articleId,
    });
    // For each block, generate an embedding and patch the block
    await Promise.all(
      blocks.map(async (block) => {
        if (!args.overwrite) {
          const existingEmbedding = await ctx.runQuery(
            api.blocks.getBlockEmbedding,
            {
              blockId: block._id,
            }
          );
          if (existingEmbedding.length > 0) {
            console.log("Block already has an embedding, skipping");
            return;
          }
        }
        const { embed } = await import("ai");
        const { openai } = await import("@ai-sdk/openai");
        let textForEmbedding = "";
        if (block.type === "header" || block.type === "text") {
          textForEmbedding = block.text ?? "";
        } else if (block.type === "list") {
          textForEmbedding = (block.items ?? []).join("\n");
        } else if (block.type === "code") {
          textForEmbedding = block.code ?? "";
        } else if (block.type === "image") {
          textForEmbedding = block.aiSummary ?? "";
        }
        if (textForEmbedding === "") return;
        const embeddingResponse = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: textForEmbedding,
        });
        // Patch the block with the embedding using the mutation
        await ctx.runMutation(api.blocks.setBlockEmbedding, {
          blockId: block._id,
          embedding: embeddingResponse.embedding,
        });
      })
    );
  },
});

export const getBlocksByVectorSearch = action({
  args: {
    query: v.string(),
  },
  returns: v.object({
    articles: v.array(
      v.object({
        _id: v.id("articles"),
        _creationTime: v.number(),
        title: v.optional(v.string()),
        categoryId: v.optional(v.id("categories")),
        url: v.string(),
        blocks: v.array(blocksNoEmbeddingValidator),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const { embed } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");
    const embeddingResponse = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: args.query,
    });
    const blocksIds = await ctx.vectorSearch("blocks", "by_embedding", {
      vector: embeddingResponse.embedding,
      limit: 10,
    });
    const blocks = (await ctx.runQuery(api.blocks.getRelevantBlocks, {
      ids: blocksIds.map(
        (b: { _id: string; _score: number }) => b._id as Id<"blocks">
      ),
    })) as DataModel["blocks"]["document"][];
    //logic to only get the article that is the most relevant
    const articleIds = blocks.map((b) => b.articleId);
    //check counts by articleId
    const articleCounts = articleIds.reduce(
      (acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      },
      {} as Record<Id<"articles">, number>
    );
    //get top 3 articleIds by count
    const topArticleIds = Object.entries(articleCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([id]) => id as Id<"articles">);

    const articles = (await Promise.all(
      topArticleIds.map((articleId) =>
        ctx.runQuery(api.article.getArticleWithBlocks, {
          articleId,
        })
      )
    )) as (DataModel["articles"]["document"] & {
      blocks: Omit<DataModel["blocks"]["document"], "embedding">[];
    })[];

    return {
      articles,
    };
  },
});

export const getRelevantBlocks = query({
  args: {
    ids: v.array(v.id("blocks")),
  },
  returns: v.array(blocksNoEmbeddingValidator),
  handler: async (ctx, args) => {
    const blocks = await Promise.all(
      args.ids.map(async (id) => {
        const block = await ctx.db.get(id);
        if (!block) return null;
        delete block.embedding;
        return block;
      })
    );
    return blocks.filter((b) => b !== null);
  },
});


