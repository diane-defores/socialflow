import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

async function getAuthUserId(ctx: { db: any; auth: any }) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("friendsFilters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const setNetwork = mutation({
  args: {
    networkId: v.string(),
    names: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("friendsFilters")
      .withIndex("by_user_network", (q) =>
        q.eq("userId", userId).eq("networkId", args.networkId),
      )
      .unique();

    if (args.names.length === 0) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, { names: args.names });
      return existing._id;
    }

    return await ctx.db.insert("friendsFilters", {
      userId,
      networkId: args.networkId,
      names: args.names,
    });
  },
});
