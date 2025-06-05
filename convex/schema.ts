import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    isCompleted: v.boolean(),
    text: v.string(),
  }),
  categories: defineTable({
    name: v.string(),
    url: v.string(),
    tempId: v.optional(v.string()),
  }),
  articles: defineTable({
    title: v.optional(v.string()),
    url: v.string(),
    categoryId: v.optional(v.id("categories")),
    testToMigrate: v.optional(v.boolean()),
  }),
  embeddings: defineTable(
    v.union(
      //for the future..
      // v.object({
      //   type: v.literal("article"),
      //   articleId: v.id("articles"),
      //   embedding: v.array(v.float64()),
      // }),
      v.object({
        type: v.literal("block"),
        blockId: v.id("blocks"),
        embedding: v.array(v.float64()),
      })
    )
  )
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      filterFields: ["type"],
      dimensions: 1536,
    })
    .index("by_block_id", ["blockId"]),

  blocks: defineTable(
    v.union(
      v.object({
        type: v.literal("header"),
        level: v.string(),
        text: v.string(),
        articleId: v.id("articles"),
      }),
      v.object({
        type: v.literal("text"),
        text: v.string(),
        articleId: v.id("articles"),
      }),
      v.object({
        type: v.literal("image"),
        src: v.string(),
        alt: v.string(),
        encoding: v.string(),
        articleId: v.id("articles"),
        aiSummary: v.optional(v.string()),
      }),
      v.object({
        type: v.literal("list"),
        ordered: v.boolean(),
        items: v.array(v.string()),
        articleId: v.id("articles"),
      }),
      v.object({
        type: v.literal("code"),
        code: v.string(),
        articleId: v.id("articles"),
      })
    )
  )
    .index("by_article_id", ["articleId"])
    .index("by_type", ["type"]),
  // .vectorIndex("by_embedding", {
  //   vectorField: "embedding",
  //   dimensions: 1536,
  // }),
});
