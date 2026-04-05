import { ConvexClient } from "convex/browser";

let client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
  if (!client) {
    const url = import.meta.env.VITE_CONVEX_URL;
    if (!url) {
      throw new Error("VITE_CONVEX_URL is not set");
    }
    client = new ConvexClient(url);
  }
  return client;
}

/**
 * Wire Clerk auth into the Convex WebSocket client.
 * Call once after Clerk is ready (e.g. in App.vue setup).
 * The client will automatically refresh tokens as needed.
 */
export function initConvexAuth(
  getToken: (opts?: { template: string }) => Promise<string | null>,
) {
  const c = getConvexClient();
  c.setAuth(async () => {
    try {
      return await getToken({ template: "convex" });
    } catch {
      return null;
    }
  });
}
