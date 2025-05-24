/** @format */

import { z } from "zod";

export const articleBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("header"), level: z.string(), text: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image"),
    src: z.string(),
    alt: z.string(),
    encoding: z.literal("url"),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string()),
  }),
  z.object({ type: z.literal("code"), code: z.string() }),
]);

export const articleSchema = z.object({
  title: z.string().optional(),
  url: z.string(),
  blocks: z.array(articleBlockSchema),
  categoryId: z.string().optional(),
});

export type ArticleBlock = z.infer<typeof articleBlockSchema>;
export type ArticleResult = z.infer<typeof articleSchema>;
