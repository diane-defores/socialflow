import { enqueueSettingsPatch, flushCloudSyncQueue } from "@/lib/cloudSyncQueue";

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
  enqueueSettingsPatch(patch);
  await flushCloudSyncQueue();
}
