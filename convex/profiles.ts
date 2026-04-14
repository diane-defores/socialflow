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
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    profileId: v.string(),
    name: v.string(),
    emoji: v.string(),
    avatar: v.optional(v.string()),
    hiddenNetworks: v.optional(v.array(v.string())),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_profile", (q) =>
        q.eq("userId", userId).eq("profileId", args.profileId),
      )
      .unique();

    const patch = {
      name: args.name,
      emoji: args.emoji,
      avatar: args.avatar,
      hiddenNetworks: args.hiddenNetworks,
      createdAt: args.createdAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      userId,
      profileId: args.profileId,
      ...patch,
    });
  },
});

export const remove = mutation({
  args: { profileId: v.string() },
  handler: async (ctx, { profileId }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_profile", (q) =>
        q.eq("userId", userId).eq("profileId", profileId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
