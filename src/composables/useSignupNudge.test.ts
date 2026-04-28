import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const isAuthenticated = ref(false);
const queryMock = vi.fn();

vi.mock("@/lib/convexAuth", () => ({
  isAuthenticated,
}));

vi.mock("@/lib/convex", () => ({
  getConvexClient: () => ({
    query: queryMock,
  }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    users: {
      hasEmail: "users:hasEmail",
    },
  },
}));

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

async function loadComposable() {
  vi.resetModules();
  return import("@/composables/useSignupNudge");
}

function isoAt(day: string) {
  return new Date(`${day}T12:00:00.000Z`);
}

beforeEach(() => {
  isAuthenticated.value = true;
  queryMock.mockReset();
  queryMock.mockResolvedValue(false);
  memoryStorage.clear();

  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: memoryStorage,
    },
    configurable: true,
    writable: true,
  });

  vi.useFakeTimers();
  vi.setSystemTime(isoAt("2026-04-01"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSignupNudge", () => {
  it("does not show on first day, shows on day 2", async () => {
    const { useSignupNudge } = await loadComposable();
    const nudge = useSignupNudge();
    nudge.recordFirstLaunch();

    await nudge.check();
    expect(nudge.showNudge.value).toBe(false);

    vi.setSystemTime(isoAt("2026-04-02"));
    await nudge.check();
    expect(nudge.showNudge.value).toBe(true);
  });

  it("shows at most once per day after dismissal", async () => {
    const { useSignupNudge } = await loadComposable();
    const nudge = useSignupNudge();
    nudge.recordFirstLaunch();

    vi.setSystemTime(isoAt("2026-04-03"));
    await nudge.check();
    expect(nudge.showNudge.value).toBe(true);
    nudge.dismiss();

    await nudge.check();
    expect(nudge.showNudge.value).toBe(false);

    vi.setSystemTime(isoAt("2026-04-04"));
    await nudge.check();
    expect(nudge.showNudge.value).toBe(true);
  });

  it("pauses after five dismissals and resumes after 30 days", async () => {
    const { useSignupNudge } = await loadComposable();
    const nudge = useSignupNudge();
    nudge.recordFirstLaunch();

    for (let day = 2; day <= 6; day += 1) {
      vi.setSystemTime(isoAt(`2026-04-${String(day).padStart(2, "0")}`));
      await nudge.check();
      expect(nudge.showNudge.value).toBe(true);
      nudge.dismiss();
      expect(nudge.showNudge.value).toBe(false);
    }

    vi.setSystemTime(isoAt("2026-04-10"));
    await nudge.check();
    expect(nudge.showNudge.value).toBe(false);

    vi.setSystemTime(isoAt("2026-05-07"));
    await nudge.check();
    expect(nudge.showNudge.value).toBe(true);
  });

  it("stays hidden when user already has an email account", async () => {
    queryMock.mockResolvedValue(true);
    const { useSignupNudge } = await loadComposable();
    const nudge = useSignupNudge();
    nudge.recordFirstLaunch();
    vi.setSystemTime(isoAt("2026-04-02"));

    await nudge.check();
    expect(nudge.showNudge.value).toBe(false);
  });

  it("stays hidden when offline or query fails", async () => {
    queryMock.mockRejectedValue(new Error("offline"));
    const { useSignupNudge } = await loadComposable();
    const nudge = useSignupNudge();
    nudge.recordFirstLaunch();
    vi.setSystemTime(isoAt("2026-04-02"));

    await nudge.check();
    expect(nudge.showNudge.value).toBe(false);
  });
});
