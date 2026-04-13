import { query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

/** Return the current authenticated user, or null if not signed in. */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/** True if the current user has a password-based (email) account linked. */
export const hasEmail = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    // authAccounts table is created by @convex-dev/auth — each row links
    // a provider to a user. "password" provider means email/password.
    const accounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    return accounts.some((a) => a.provider === "password");
  },
});

/** True if a password account already exists for the given email. */
export const emailExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    if (!normalizedEmail) return false;

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", normalizedEmail),
      )
      .unique();

    return account !== null;
  },
});
