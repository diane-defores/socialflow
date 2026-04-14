import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  socialAccounts: defineTable({
    userId: v.id("users"),
    accountId: v.string(),
    networkId: v.string(),
    label: v.string(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_network", ["userId", "networkId"])
    .index("by_accountId", ["accountId"]),

  activeAccounts: defineTable({
    userId: v.id("users"),
    networkId: v.string(),
    accountId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_network", ["userId", "networkId"]),

  settings: defineTable({
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark")),
    language: v.optional(v.string()),
    sidebarVisible: v.optional(v.boolean()),
    grayscaleEnabled: v.optional(v.boolean()),
    textZoom: v.optional(v.number()),
    hapticEnabled: v.optional(v.boolean()),
    tapSoundEnabled: v.optional(v.boolean()),
    activeProfileId: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    friendsFilterEnabled: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  profiles: defineTable({
    userId: v.id("users"),
    profileId: v.string(),
    name: v.string(),
    emoji: v.string(),
    avatar: v.optional(v.string()),
    hiddenNetworks: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_profile", ["userId", "profileId"]),

  customLinks: defineTable({
    userId: v.id("users"),
    linkId: v.string(),
    profileId: v.string(),
    label: v.string(),
    url: v.string(),
    icon: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_link", ["userId", "linkId"])
    .index("by_user_profile", ["userId", "profileId"]),

  friendsFilters: defineTable({
    userId: v.id("users"),
    networkId: v.string(),
    names: v.array(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_user_network", ["userId", "networkId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("team")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
    ),
    expiresAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
});
