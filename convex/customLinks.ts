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
      .query("customLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    linkId: v.string(),
    profileId: v.string(),
    label: v.string(),
    url: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("customLinks")
      .withIndex("by_user_link", (q) =>
        q.eq("userId", userId).eq("linkId", args.linkId),
      )
      .unique();

    const patch = {
      profileId: args.profileId,
      label: args.label,
      url: args.url,
      icon: args.icon,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("customLinks", {
      userId,
      linkId: args.linkId,
      ...patch,
    });
  },
});

export const remove = mutation({
  args: { linkId: v.string() },
  handler: async (ctx, { linkId }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("customLinks")
      .withIndex("by_user_link", (q) =>
        q.eq("userId", userId).eq("linkId", linkId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
