import type { MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";

type AuthCtx = Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">;

export async function requireAuthUserId(ctx: AuthCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}
