import { ConvexHttpClient } from "convex/browser";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    const url = import.meta.env.VITE_CONVEX_URL;
    if (!url) {
      throw new Error("VITE_CONVEX_URL is not set");
    }
    client = new ConvexHttpClient(url);
  }
  return client;
}
