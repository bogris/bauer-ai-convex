/** @format */

import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { articleSchema } from "../schemas/article-export";
import { Id } from "./_generated/dataModel";
import { z } from "zod";
import { zCustomAction } from "convex-helpers/server/zod";
import { NoOp } from "convex-helpers/server/customFunctions";
import { api, internal } from "./_generated/api";
import { categories } from "../scripts/scraping/out/categories";

export const insertArticleWithBlocks = internalMutation({
  args: {
    title: v.optional(v.string()),
    url: v.string(),
    categoryId: v.optional(v.id("categories")),
    blocks: v.array(
      v.union(
        v.object({
          type: v.literal("header"),
          level: v.string(),
          text: v.string(),
        }),
        v.object({ type: v.literal("text"), text: v.string() }),
        v.object({
          type: v.literal("image"),
          src: v.string(),
          alt: v.string(),
          encoding: v.string(),
        }),
        v.object({
          type: v.literal("list"),
          ordered: v.boolean(),
          items: v.array(v.string()),
        }),
        v.object({ type: v.literal("code"), code: v.string() })
      )
    ),
  },
  returns: v.id("articles"),
  handler: async (ctx, args) => {
    const { title, url, categoryId, blocks } = args;
    const articleInsert: {
      title?: string;
      url: string;
      categoryId?: Id<"categories">;
    } = { title, url };
    if (categoryId) articleInsert.categoryId = categoryId;
    const articleId = await ctx.db.insert("articles", articleInsert);
    for (const block of blocks) {
      await ctx.db.insert("blocks", {
        ...block,
        articleId,
      });
    }
    return articleId;
  },
});

export const importArticlesFromFile = zCustomAction(
  action,
  NoOp
)({
  args: {
    fileId: z.string(),
  },
  returns: z.null(),
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.fileId);
    if (!url) throw new Error("File not found in storage");
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch file");
    const text = await res.text();
    const articles = articleSchema.array().parse(JSON.parse(text));
    const existingCategories = await ctx.runQuery(
      api.importArticles.listCategories
    );
    console.log(existingCategories);
    await Promise.all(
      articles.map((article) => {
        const { title, url, blocks, categoryId } = article;
        const category = existingCategories.find(
          (c) => c.tempId === categoryId
        );
        const mutationArgs: {
          title?: string;
          url: string;
          blocks: typeof blocks;
          categoryId?: Id<"categories">;
        } = { title, url, blocks };
        if (category) {
          mutationArgs.categoryId = category.id;
        }
        return ctx.runMutation(
          internal.importArticles.insertArticleWithBlocks,
          mutationArgs
        );
      })
    );
    return null;
  },
});

export const listCategories = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      url: v.string(),
      tempId: v.optional(v.string()),
      id: v.id("categories"),
    })
  ),
  handler: async (ctx) => {
    const existingCategories = await ctx.db.query("categories").collect();
    return existingCategories.map((category) => ({
      name: category.name,
      url: category.url,
      tempId: category.tempId,
      id: category._id,
    }));
  },
});

export const loadCategoriesFromLocalTs = mutation({
  args: {},
  returns: v.array(v.id("categories")),
  handler: async (ctx) => {
    const result = categories.map((category) =>
      ctx.db.insert("categories", {
        name: category.name,
        url: category.url,
        tempId: category.id,
      })
    );
    return await Promise.all(result);
  },
});

export const listAllArticles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("articles"),
      title: v.optional(v.string()),
      url: v.string(),
    })
  ),
  handler: async (ctx) => {
    const articles = await ctx.db.query("articles").collect();
    return articles.map((a) => ({
      _id: a._id,
      title: a.title,
      url: a.url,
    }));
  },
});
