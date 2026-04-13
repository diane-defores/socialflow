import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous, Password],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      const userData = {
        ...(typeof profile.email === "string" ? { email: profile.email } : {}),
        ...(typeof profile.name === "string" ? { name: profile.name } : {}),
        ...(typeof profile.avatarUrl === "string"
          ? { avatarUrl: profile.avatarUrl }
          : {}),
        ...(typeof profile.isAnonymous === "boolean"
          ? { isAnonymous: profile.isAnonymous }
          : {}),
      };

      if (existingUserId !== null) {
        await ctx.db.patch(existingUserId, userData);
        return existingUserId;
      }

      return await ctx.db.insert("users", {
        ...userData,
        createdAt: Date.now(),
      });
    },
  },
});
