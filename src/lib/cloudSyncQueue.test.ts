import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "sfz_cloud_sync_queue_v1";
const mocked = vi.hoisted(() => ({
  mutationMock: vi.fn(),
  isAuthenticated: { value: false },
  isConvexConfigured: { value: true },
}));

vi.mock("@/lib/convex", () => ({
  getConvexClient: () => ({
    mutation: mocked.mutationMock,
  }),
}));

vi.mock("@/lib/convexAuth", () => ({
  isAuthenticated: mocked.isAuthenticated,
  isConvexConfigured: mocked.isConvexConfigured,
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    settings: { upsert: "settings:upsert" },
    profiles: { upsert: "profiles:upsert", remove: "profiles:remove" },
    customLinks: { upsert: "customLinks:upsert", remove: "customLinks:remove" },
    friendsFilters: { setNetwork: "friendsFilters:setNetwork" },
    socialAccounts: {
      upsert: "socialAccounts:upsert",
      remove: "socialAccounts:remove",
      setActive: "socialAccounts:setActive",
    },
  },
}));

import {
  clearCloudSyncQueue,
  enqueueProfileRemove,
  enqueueSettingsPatch,
  flushCloudSyncQueue,
  hasPendingCloudSync,
} from "@/lib/cloudSyncQueue";

const mutationMock = mocked.mutationMock;
const isAuthenticated = mocked.isAuthenticated;
const isConvexConfigured = mocked.isConvexConfigured;

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.map.set(key, value);
  }

  removeItem(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

const memoryStorage = new MemoryStorage();

function readQueueFromStorage() {
  const raw = memoryStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Array<Record<string, unknown>>;
}

beforeEach(() => {
  mutationMock.mockReset();
  isAuthenticated.value = false;
  isConvexConfigured.value = true;

  memoryStorage.clear();
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: memoryStorage,
      setTimeout,
      clearTimeout,
      addEventListener: vi.fn(),
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "document", {
    value: {
      addEventListener: vi.fn(),
      visibilityState: "visible",
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
    writable: true,
  });

  clearCloudSyncQueue();
});

describe("cloud sync queue", () => {
  it("recovers from malformed local storage JSON", () => {
    memoryStorage.setItem(STORAGE_KEY, "{bad json");
    expect(hasPendingCloudSync()).toBe(false);
  });

  it("merges consecutive settings patches by key", () => {
    enqueueSettingsPatch({ language: "fr" });
    enqueueSettingsPatch({ theme: "dark" });

    const queue = readQueueFromStorage();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("settingsPatch");
    expect(queue[0].patch).toMatchObject({ language: "fr", theme: "dark" });
  });

  it("flushes queued operations when auth and network are available", async () => {
    isAuthenticated.value = true;
    mutationMock.mockResolvedValue(undefined);

    enqueueProfileRemove("profile-1");
    await flushCloudSyncQueue();

    expect(hasPendingCloudSync()).toBe(false);
    expect(mutationMock).toHaveBeenCalledTimes(1);
    expect(mutationMock).toHaveBeenCalledWith("profiles:remove", {
      profileId: "profile-1",
    });
  });

  it("increments attempts and keeps failed operations for retry", async () => {
    isAuthenticated.value = true;
    mutationMock.mockRejectedValue(new Error("boom"));
    enqueueProfileRemove("profile-2");

    await flushCloudSyncQueue();

    const queue = readQueueFromStorage();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("profileRemove");
    expect(queue[0].attempts).toBe(1);
  });
});
