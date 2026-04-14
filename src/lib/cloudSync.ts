import { getConvexClient } from "@/lib/convex";
import { isAuthenticated } from "@/lib/convexAuth";
import { syncSettingsPatch } from "@/lib/cloudSettings";
import { api } from "../../convex/_generated/api";
import { useAccountsStore } from "@/stores/accounts";
import { useProfilesStore } from "@/stores/profiles";
import { useCustomLinksStore } from "@/stores/customLinks";
import { useFriendsFilterStore } from "@/stores/friendsFilter";
import { useThemeStore } from "@/stores/theme";
import { useOnboardingStore } from "@/stores/onboarding";
import { setLocale } from "@/utils/i18n";

let hydratedUserId: string | null = null;
let hydratePromise: Promise<void> | null = null;
const REOPEN_SETTINGS_AFTER_AUTH_KEY = "sfz_reopen_settings_after_auth";

function applyCloudSettings(settings: any) {
  const themeStore = useThemeStore();
  const profilesStore = useProfilesStore();
  const friendsStore = useFriendsFilterStore();
  const onboardingStore = useOnboardingStore();

  if (!settings) return false;

  themeStore.applyCloudPreferences(settings);

  if (typeof settings.language === "string") {
    setLocale(settings.language, false);
  }

  if (typeof settings.activeProfileId === "string") {
    profilesStore.activeProfileId = settings.activeProfileId;
  }

  if (typeof settings.friendsFilterEnabled === "boolean") {
    friendsStore.enabled = settings.friendsFilterEnabled;
  }

  if (typeof settings.onboardingCompleted === "boolean") {
    onboardingStore.completed = settings.onboardingCompleted;
  }

  return true;
}

async function seedCloudFromLocalIfEmpty(snapshot: {
  settings: any;
  profiles: any[];
  customLinks: any[];
  friendsFilters: any[];
  socialAccounts: any[];
  activeAccounts: any[];
}) {
  const profilesStore = useProfilesStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const accountsStore = useAccountsStore();
  const themeStore = useThemeStore();
  const onboardingStore = useOnboardingStore();

  if (!snapshot.settings) {
    await syncSettingsPatch({
      theme: themeStore.isDarkMode ? "dark" : "light",
      language: localStorage.getItem("user-locale") ?? "fr",
      grayscaleEnabled: themeStore.grayscaleEnabled,
      textZoom: Number(localStorage.getItem("sfz_text_zoom") ?? "100"),
      hapticEnabled: localStorage.getItem("sfz_haptic") !== "false",
      tapSoundEnabled: localStorage.getItem("sfz_tap_sound") === "true",
      activeProfileId: profilesStore.activeProfileId || undefined,
      onboardingCompleted: onboardingStore.completed,
      friendsFilterEnabled: friendsStore.enabled,
    });
  }

  if (snapshot.profiles.length === 0 && profilesStore.profiles.length > 0) {
    await profilesStore.seedCloud();
  }

  if (snapshot.customLinks.length === 0 && Object.keys(customLinksStore.links).length > 0) {
    await customLinksStore.seedCloud();
  }

  if (snapshot.friendsFilters.length === 0 && Object.keys(friendsStore.friends).length > 0) {
    await friendsStore.seedCloud();
  }

  if (snapshot.socialAccounts.length === 0 && accountsStore.accounts.length > 0) {
    await accountsStore.seedCloud();
  }
}

export async function hydrateCloudState() {
  if (!isAuthenticated.value) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const client = getConvexClient();
    const user = await client.query(api.users.getMe, {});
    if (!user?._id) return;
    if (hydratedUserId === user._id) return;

    const [
      settings,
      profiles,
      customLinks,
      friendsFilters,
      socialAccounts,
      activeAccounts,
    ] = await Promise.all([
      client.query(api.settings.get, {}),
      client.query(api.profiles.list, {}),
      client.query(api.customLinks.list, {}),
      client.query(api.friendsFilters.list, {}),
      client.query(api.socialAccounts.list, {}),
      client.query(api.socialAccounts.listActive, {}),
    ]);

    const profilesStore = useProfilesStore();
    const customLinksStore = useCustomLinksStore();
    const friendsStore = useFriendsFilterStore();
    const accountsStore = useAccountsStore();

    const hadCloudSettings = applyCloudSettings(settings);

    if (profiles.length > 0) {
      profilesStore.replaceFromCloud(profiles, settings?.activeProfileId);
    }
    if (customLinks.length > 0) {
      customLinksStore.replaceFromCloud(customLinks);
    }
    if (friendsFilters.length > 0 || hadCloudSettings) {
      friendsStore.replaceFromCloud(friendsFilters, settings?.friendsFilterEnabled ?? false);
    }
    if (socialAccounts.length > 0 || activeAccounts.length > 0) {
      accountsStore.replaceFromCloud(socialAccounts, activeAccounts);
    }

    await seedCloudFromLocalIfEmpty({
      settings,
      profiles,
      customLinks,
      friendsFilters,
      socialAccounts,
      activeAccounts,
    });

    hydratedUserId = user._id;
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

export function resetCloudSyncState() {
  hydratedUserId = null;
  hydratePromise = null;
}

export function resetSyncedLocalState() {
  const profilesStore = useProfilesStore();
  const accountsStore = useAccountsStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const themeStore = useThemeStore();
  const onboardingStore = useOnboardingStore();

  profilesStore.clearLocal();
  accountsStore.clearLocal();
  customLinksStore.clearLocal();
  friendsStore.clearLocal();
  themeStore.resetLocalPreferences();
  onboardingStore.reset();

  localStorage.removeItem("sfz_email");
  localStorage.removeItem("user-locale");
  localStorage.removeItem("theme");
  localStorage.removeItem("grayscale");
  localStorage.removeItem("sfz_haptic");
  localStorage.removeItem("sfz_tap_sound");
  localStorage.removeItem("sfz_text_zoom");
}

export function consumeReopenSettingsAfterAuth() {
  const shouldReopen = localStorage.getItem(REOPEN_SETTINGS_AFTER_AUTH_KEY) === "1";
  if (shouldReopen) {
    localStorage.removeItem(REOPEN_SETTINGS_AFTER_AUTH_KEY);
  }
  return shouldReopen;
}

export async function finalizePasswordSignIn(options?: {
  email?: string;
  reload?: boolean;
  reopenSettings?: boolean;
}) {
  if (options?.email) {
    localStorage.setItem("sfz_email", options.email);
  }

  await hydrateCloudState();

  if (options?.reload ?? true) {
    if (options?.reopenSettings) {
      localStorage.setItem(REOPEN_SETTINGS_AFTER_AUTH_KEY, "1");
    }
    window.location.reload();
  }
}
