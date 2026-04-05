import { query } from "./_generated/server";
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
