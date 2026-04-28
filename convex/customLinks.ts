import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./authHelpers";
import {
  assertEntityId,
  assertHttpUrl,
  assertIcon,
  assertLabel,
} from "./validators";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
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
    const userId = await requireAuthUserId(ctx);
    assertEntityId(args.linkId, "linkId");
    assertEntityId(args.profileId, "profileId");
    assertLabel(args.label);
    assertHttpUrl(args.url);
    assertIcon(args.icon);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_profile", (q) =>
        q.eq("userId", userId).eq("profileId", args.profileId),
      )
      .unique();

    if (!profile) {
      throw new Error("Profile not found for current user");
    }
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
    const userId = await requireAuthUserId(ctx);
    assertEntityId(linkId, "linkId");
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
