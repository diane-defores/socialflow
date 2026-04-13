import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

async function getAuthUserId(ctx: { db: any; auth: any }) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    sidebarVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const patch: {
      theme?: "light" | "dark";
      language?: string;
      sidebarVisible?: boolean;
    } = {};

    if (args.theme !== undefined) {
      patch.theme = args.theme;
    }
    if (args.language !== undefined) {
      patch.language = args.language;
    }
    if (args.sidebarVisible !== undefined) {
      patch.sidebarVisible = args.sidebarVisible;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("settings", {
        userId,
        theme: args.theme ?? "dark",
        language: args.language,
        sidebarVisible: args.sidebarVisible,
      });
    }
  },
});
