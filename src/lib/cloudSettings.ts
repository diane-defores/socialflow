import { getConvexClient } from "@/lib/convex";
import { api } from "../../convex/_generated/api";

export interface CloudSettingsPatch {
  theme?: "light" | "dark";
  language?: string;
  sidebarVisible?: boolean;
  grayscaleEnabled?: boolean;
  textZoom?: number;
  hapticEnabled?: boolean;
  tapSoundEnabled?: boolean;
  activeProfileId?: string;
  onboardingCompleted?: boolean;
  friendsFilterEnabled?: boolean;
}

export async function syncSettingsPatch(patch: CloudSettingsPatch) {
  try {
    const client = getConvexClient();
    await client.mutation(api.settings.upsert, patch);
  } catch {
    // Offline or not authenticated.
  }
}
