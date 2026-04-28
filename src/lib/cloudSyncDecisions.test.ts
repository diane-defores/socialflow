import { describe, expect, it } from "vitest";
import {
  canReuseLocalCloudState,
  isCloudSnapshotEmpty,
  shouldKeepLocalWhenCloudEmpty,
} from "@/lib/cloudSyncDecisions";

describe("cloud sync decisions", () => {
  it("detects empty and non-empty snapshots", () => {
    expect(
      isCloudSnapshotEmpty({
        settings: null,
        profiles: [],
        customLinks: [],
        friendsFilters: [],
        socialAccounts: [],
        activeAccounts: [],
      }),
    ).toBe(true);

    expect(
      isCloudSnapshotEmpty({
        settings: null,
        profiles: [{ profileId: "p1" }],
        customLinks: [],
        friendsFilters: [],
        socialAccounts: [],
        activeAccounts: [],
      }),
    ).toBe(false);
  });

  it("reuses local state for anonymous or remembered users", () => {
    expect(
      canReuseLocalCloudState({
        isAnonymousUser: true,
        rememberedUserId: null,
        currentUserId: "u1",
      }),
    ).toBe(true);

    expect(
      canReuseLocalCloudState({
        isAnonymousUser: false,
        rememberedUserId: "u1",
        currentUserId: "u1",
      }),
    ).toBe(true);

    expect(
      canReuseLocalCloudState({
        isAnonymousUser: false,
        rememberedUserId: "u1",
        currentUserId: "u2",
      }),
    ).toBe(false);
  });

  it("keeps local data when allowed by reuse or sign-up seeding", () => {
    expect(
      shouldKeepLocalWhenCloudEmpty({
        canReuseLocalState: true,
      }),
    ).toBe(true);

    expect(
      shouldKeepLocalWhenCloudEmpty({
        canReuseLocalState: false,
        allowLocalSeedIfEmpty: true,
      }),
    ).toBe(true);

    expect(
      shouldKeepLocalWhenCloudEmpty({
        canReuseLocalState: false,
        allowLocalSeedIfEmpty: false,
      }),
    ).toBe(false);
  });
});
