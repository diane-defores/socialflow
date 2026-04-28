import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const authState = vi.hoisted(() => ({
  userId: "",
  authenticated: true,
}));

// Limitation: convex-test can simulate identity but not the full @convex-dev/auth user
// resolution path used by `auth.getUserId(ctx)` without additional auth-component setup.
// We mock only this boundary and keep all DB invariants exercised through convex-test.
vi.mock("./authHelpers", () => ({
  requireAuthUserId: vi.fn(async () => {
    if (!authState.authenticated) {
      throw new Error("Not authenticated");
    }
    return authState.userId;
  }),
}));

beforeEach(() => {
  authState.userId = "";
  authState.authenticated = true;
});

describe("Convex mutation invariants (convex-test)", () => {
  it("AC3: unauthenticated calls do not read or mutate cloud data", async () => {
    const t = convexTest(schema, modules);

    authState.authenticated = false;

    await expect(t.query(api.customLinks.list, {})).rejects.toThrow(/not authenticated/i);
    await expect(
      t.mutation(api.socialAccounts.setActive, {
        networkId: "twitter",
        accountId: "acc-1",
      }),
    ).rejects.toThrow(/not authenticated/i);

    const [customLinks, activeAccounts] = await Promise.all([
      t.run((ctx) => ctx.db.query("customLinks").collect()),
      t.run((ctx) => ctx.db.query("activeAccounts").collect()),
    ]);

    expect(customLinks).toHaveLength(0);
    expect(activeAccounts).toHaveLength(0);
  });

  it("AC4: rejects active-account writes for foreign account ownership", async () => {
    const t = convexTest(schema, modules);

    const userA = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    const userB = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    authState.userId = userA;

    await t.run((ctx) =>
      ctx.db.insert("socialAccounts", {
        userId: userB,
        accountId: "acc-foreign",
        networkId: "twitter",
        label: "foreign",
        addedAt: Date.now(),
      }),
    );

    await expect(
      t.mutation(api.socialAccounts.setActive, {
        networkId: "twitter",
        accountId: "acc-foreign",
      }),
    ).rejects.toThrow(/current user/i);

    const activeAccounts = await t.run((ctx) => ctx.db.query("activeAccounts").collect());
    expect(activeAccounts).toHaveLength(0);
  });

  it("AC5: rejects active-account writes when network does not match account", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    authState.userId = userId;

    await t.run((ctx) =>
      ctx.db.insert("socialAccounts", {
        userId,
        accountId: "acc-1",
        networkId: "twitter",
        label: "owned",
        addedAt: Date.now(),
      }),
    );

    await expect(
      t.mutation(api.socialAccounts.setActive, {
        networkId: "facebook",
        accountId: "acc-1",
      }),
    ).rejects.toThrow(/requested network/i);

    const activeAccounts = await t.run((ctx) => ctx.db.query("activeAccounts").collect());
    expect(activeAccounts).toHaveLength(0);
  });

  it("AC6: rejects unsafe custom link schemes before persistence", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    authState.userId = userId;

    await t.run((ctx) =>
      ctx.db.insert("profiles", {
        userId,
        profileId: "profile-1",
        name: "Main",
        emoji: "🙂",
        createdAt: Date.now(),
      }),
    );

    await expect(
      t.mutation(api.customLinks.upsert, {
        linkId: "link-1",
        profileId: "profile-1",
        label: "Unsafe",
        url: "javascript:alert(1)",
        icon: "pi pi-link",
      }),
    ).rejects.toThrow(/http or https/i);

    const links = await t.run((ctx) => ctx.db.query("customLinks").collect());
    expect(links).toHaveLength(0);
  });

  it("AC7: rejects missing or foreign profile references", async () => {
    const t = convexTest(schema, modules);

    const userA = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    const userB = await t.run((ctx) => ctx.db.insert("users", { createdAt: Date.now() }));
    authState.userId = userA;

    await t.run((ctx) =>
      ctx.db.insert("profiles", {
        userId: userB,
        profileId: "profile-foreign",
        name: "Foreign",
        emoji: "😎",
        createdAt: Date.now(),
      }),
    );

    await expect(
      t.mutation(api.settings.upsert, {
        activeProfileId: "profile-missing",
      }),
    ).rejects.toThrow(/does not belong to current user/i);

    await expect(
      t.mutation(api.customLinks.upsert, {
        linkId: "link-2",
        profileId: "profile-foreign",
        label: "Docs",
        url: "https://example.com",
        icon: "pi pi-link",
      }),
    ).rejects.toThrow(/profile not found/i);

    const [settingsRows, links] = await Promise.all([
      t.run((ctx) => ctx.db.query("settings").collect()),
      t.run((ctx) => ctx.db.query("customLinks").collect()),
    ]);

    expect(settingsRows).toHaveLength(0);
    expect(links).toHaveLength(0);
  });
});
