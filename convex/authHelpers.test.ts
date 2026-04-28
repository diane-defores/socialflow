import { beforeEach, describe, expect, it, vi } from "vitest";

const authModuleMock = vi.hoisted(() => ({
  getUserId: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: {
    getUserId: authModuleMock.getUserId,
  },
}));

async function loadAuthHelpers() {
  return import("./authHelpers");
}

beforeEach(() => {
  authModuleMock.getUserId.mockReset();
});

describe("requireAuthUserId", () => {
  it("throws when no authenticated user exists", async () => {
    const { requireAuthUserId } = await loadAuthHelpers();
    authModuleMock.getUserId.mockResolvedValue(null);
    await expect(
      requireAuthUserId({ auth: {} } as never),
    ).rejects.toThrow(/not authenticated/i);
  });

  it("returns the authenticated user id", async () => {
    const { requireAuthUserId } = await loadAuthHelpers();
    authModuleMock.getUserId.mockResolvedValue("user-1");
    await expect(requireAuthUserId({ auth: {} } as never)).resolves.toBe("user-1");
  });
});
