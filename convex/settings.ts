import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./authHelpers";
import { assertEntityId, assertLanguage, assertTextZoom } from "./validators";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    return await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
    language: v.optional(v.string()),
    sidebarVisible: v.optional(v.boolean()),
    grayscaleEnabled: v.optional(v.boolean()),
    textZoom: v.optional(v.number()),
    hapticEnabled: v.optional(v.boolean()),
    tapSoundEnabled: v.optional(v.boolean()),
    tapSoundVariant: v.optional(v.union(v.literal("classic"), v.literal("soft"), v.literal("pop"))),
    activeProfileId: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    friendsFilterEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const patch: {
      theme?: "light" | "dark" | "auto";
      language?: string;
      sidebarVisible?: boolean;
      grayscaleEnabled?: boolean;
      textZoom?: number;
      hapticEnabled?: boolean;
      tapSoundEnabled?: boolean;
      tapSoundVariant?: "classic" | "soft" | "pop";
      activeProfileId?: string;
      onboardingCompleted?: boolean;
      friendsFilterEnabled?: boolean;
    } = {};

    if (args.theme !== undefined) {
      patch.theme = args.theme;
    }
    if (args.language !== undefined) {
      assertLanguage(args.language);
      patch.language = args.language;
    }
    if (args.sidebarVisible !== undefined) {
      patch.sidebarVisible = args.sidebarVisible;
    }
    if (args.grayscaleEnabled !== undefined) {
      patch.grayscaleEnabled = args.grayscaleEnabled;
    }
    if (args.textZoom !== undefined) {
      assertTextZoom(args.textZoom);
      patch.textZoom = args.textZoom;
    }
    if (args.hapticEnabled !== undefined) {
      patch.hapticEnabled = args.hapticEnabled;
    }
    if (args.tapSoundEnabled !== undefined) {
      patch.tapSoundEnabled = args.tapSoundEnabled;
    }
    if (args.tapSoundVariant !== undefined) {
      patch.tapSoundVariant = args.tapSoundVariant;
    }
    if (args.activeProfileId !== undefined) {
      const activeProfileId = args.activeProfileId;
      assertEntityId(activeProfileId, "activeProfileId");
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_profile", (q) =>
          q.eq("userId", userId).eq("profileId", activeProfileId),
        )
        .unique();
      if (!profile) {
        throw new Error("activeProfileId does not belong to current user");
      }
      patch.activeProfileId = activeProfileId;
    }
    if (args.onboardingCompleted !== undefined) {
      patch.onboardingCompleted = args.onboardingCompleted;
    }
    if (args.friendsFilterEnabled !== undefined) {
      patch.friendsFilterEnabled = args.friendsFilterEnabled;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("settings", {
        userId,
        theme: args.theme ?? "dark",
        language: args.language,
        sidebarVisible: args.sidebarVisible,
        grayscaleEnabled: args.grayscaleEnabled,
        textZoom: args.textZoom,
        hapticEnabled: args.hapticEnabled,
        tapSoundEnabled: args.tapSoundEnabled,
        tapSoundVariant: args.tapSoundVariant,
        activeProfileId: args.activeProfileId,
        onboardingCompleted: args.onboardingCompleted,
        friendsFilterEnabled: args.friendsFilterEnabled,
      });
    }
  },
});
