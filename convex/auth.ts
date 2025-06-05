/** @format */

import { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

export const getUserId = async (ctx: QueryCtx | ActionCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject;
  if (!userId) throw new Error("User not authenticated");
  return userId;
};
