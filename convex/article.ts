/** @format */

import { v } from "convex/values";
import { query } from "./_generated/server";

export const getArticle = query({
  args: {
    articleId: v.id("articles"),
  },
  returns: v.object({
    _id: v.id("articles"),
    _creationTime: v.number(),
    title: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    return article;
  },
});
