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
      .query("socialAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    accountId: v.string(),
    networkId: v.string(),
    label: v.string(),
    addedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();

    if (existing) {
      if (existing.userId !== userId) {
        throw new Error("Account belongs to another user");
      }
      await ctx.db.patch(existing._id, { label: args.label });
      return existing._id;
    }

    return await ctx.db.insert("socialAccounts", {
      userId,
      accountId: args.accountId,
      networkId: args.networkId,
      label: args.label,
      addedAt: args.addedAt,
    });
  },
});

export const remove = mutation({
  args: { accountId: v.string() },
  handler: async (ctx, { accountId }) => {
    const userId = await getAuthUserId(ctx);

    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();

    if (!account || account.userId !== userId) return;
    await ctx.db.delete(account._id);

    const active = await ctx.db
      .query("activeAccounts")
      .withIndex("by_user_network", (q) =>
        q.eq("userId", userId).eq("networkId", account.networkId),
      )
      .unique();

    if (active?.accountId === accountId) {
      await ctx.db.delete(active._id);
    }
  },
});

export const setActive = mutation({
  args: { networkId: v.string(), accountId: v.string() },
  handler: async (ctx, { networkId, accountId }) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("activeAccounts")
      .withIndex("by_user_network", (q) =>
        q.eq("userId", userId).eq("networkId", networkId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { accountId });
    } else {
      await ctx.db.insert("activeAccounts", {
        userId,
        networkId,
        accountId,
      });
    }
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("activeAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});
