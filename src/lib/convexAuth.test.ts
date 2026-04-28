import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  return {
    action: vi.fn(),
    tokenCallback: null as null | ((args: { forceRefreshToken: boolean }) => Promise<string | null>),
    onAuthStateChange: null as null | ((authenticated: boolean) => void),
  };
});

vi.mock("convex/browser", () => {
  class MockConvexClient {
    setAuth(
      tokenCallback: (args: { forceRefreshToken: boolean }) => Promise<string | null>,
      onAuthStateChange: (authenticated: boolean) => void,
    ) {
      mockState.tokenCallback = tokenCallback;
      mockState.onAuthStateChange = onAuthStateChange;
    }
  }

  class MockConvexHttpClient {
    constructor(_url: string) {}

    action = mockState.action;
  }

  return {
    ConvexClient: MockConvexClient,
    ConvexHttpClient: MockConvexHttpClient,
  };
});

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string) {
    return this.map.get(key) ?? null;
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

const CONVEX_URL = "https://demo.convex.cloud";
const NAMESPACE = CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "");
const JWT_STORAGE_KEY = `__convexAuthJWT_${NAMESPACE}`;
const REFRESH_STORAGE_KEY = `__convexAuthRefreshToken_${NAMESPACE}`;

async function loadAuthModule() {
  vi.resetModules();
  return import("@/lib/convexAuth");
}

function createMockClient() {
  return {
    setAuth: (
      tokenCallback: (args: { forceRefreshToken: boolean }) => Promise<string | null>,
      onAuthStateChange: (authenticated: boolean) => void,
    ) => {
      mockState.tokenCallback = tokenCallback;
      mockState.onAuthStateChange = onAuthStateChange;
    },
  };
}

beforeEach(() => {
  mockState.action.mockReset();
  mockState.tokenCallback = null;
  mockState.onAuthStateChange = null;

  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
});

describe("convexAuth client boundaries", () => {
  it("restores a stored namespaced session token during setup", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-1");
    const { setupConvexAuth, isAuthenticated, isAuthLoading } = await loadAuthModule();

    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    expect(isAuthenticated.value).toBe(true);
    expect(isAuthLoading.value).toBe(false);
    expect(mockState.action).not.toHaveBeenCalled();
  });

  it("persists sign-in tokens under the Convex namespace", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-initial");
    localStorage.setItem(REFRESH_STORAGE_KEY, "refresh-initial");
    mockState.action.mockResolvedValue({
      tokens: {
        token: "jwt-2",
        refreshToken: "refresh-2",
      },
    });

    const { setupConvexAuth, signIn } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);
    await signIn("password", { email: "user@test.com", password: "secret" });

    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBe("jwt-2");
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBe("refresh-2");
    expect(mockState.action).toHaveBeenCalledWith("auth:signIn", {
      provider: "password",
      params: { email: "user@test.com", password: "secret" },
    });
  });

  it("clears tokens when refresh is requested without a refresh token", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-3");
    const { setupConvexAuth, isAuthenticated } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);

    localStorage.removeItem(REFRESH_STORAGE_KEY);
    const refreshed = await mockState.tokenCallback?.({ forceRefreshToken: true });

    expect(refreshed).toBeNull();
    expect(isAuthenticated.value).toBe(false);
    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBeNull();
  });

  it("clears tokens on sign out even if server sign-out fails", async () => {
    localStorage.setItem(JWT_STORAGE_KEY, "jwt-4");
    localStorage.setItem(REFRESH_STORAGE_KEY, "refresh-4");
    mockState.action.mockRejectedValue(new Error("sign out failed"));

    const { setupConvexAuth, signOut, isAuthenticated } = await loadAuthModule();
    await setupConvexAuth(createMockClient() as never, CONVEX_URL);
    await signOut();

    expect(localStorage.getItem(JWT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
    expect(isAuthenticated.value).toBe(false);
  });
});
