import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./authHelpers";
import {
  assertAvatar,
  assertEmoji,
  assertEntityId,
  assertHiddenNetworks,
  assertProfileName,
} from "./validators";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
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
    const userId = await requireAuthUserId(ctx);
    assertEntityId(args.profileId, "profileId");
    assertProfileName(args.name);
    assertEmoji(args.emoji);
    assertAvatar(args.avatar);
    assertHiddenNetworks(args.hiddenNetworks);

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
    const userId = await requireAuthUserId(ctx);
    assertEntityId(profileId, "profileId");
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
