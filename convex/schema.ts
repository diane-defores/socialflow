import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

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
  }).index("by_userId", ["userId"]),

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
