import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("User not found");
  return user;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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
    const user = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { label: args.label });
      return existing._id;
    }

    return await ctx.db.insert("socialAccounts", {
      userId: user._id,
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
    const user = await getAuthUser(ctx);

    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .unique();

    if (!account || account.userId !== user._id) return;
    await ctx.db.delete(account._id);

    // Also remove from active if set
    const active = await ctx.db
      .query("activeAccounts")
      .withIndex("by_user_network", (q) =>
        q.eq("userId", user._id).eq("networkId", account.networkId)
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
    const user = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("activeAccounts")
      .withIndex("by_user_network", (q) =>
        q.eq("userId", user._id).eq("networkId", networkId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { accountId });
    } else {
      await ctx.db.insert("activeAccounts", {
        userId: user._id,
        networkId,
        accountId,
      });
    }
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    return await ctx.db
      .query("activeAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});
