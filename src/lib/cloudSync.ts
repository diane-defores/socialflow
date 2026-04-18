import { getConvexClient } from "@/lib/convex";
import { isAuthenticated } from "@/lib/convexAuth";
import { syncSettingsPatch } from "@/lib/cloudSettings";
import { clearCloudSyncQueue, flushCloudSyncQueue } from "@/lib/cloudSyncQueue";
import { api } from "../../convex/_generated/api";
import { useAccountsStore } from "@/stores/accounts";
import { useProfilesStore } from "@/stores/profiles";
import { useCustomLinksStore } from "@/stores/customLinks";
import { useFriendsFilterStore } from "@/stores/friendsFilter";
import { useThemeStore } from "@/stores/theme";
import { useOnboardingStore } from "@/stores/onboarding";
import { setLocale } from "@/utils/i18n";
import {
  advancePostAuthSyncStage,
  beginPostAuthSyncFeedback,
  queuePostAuthReadyNotice,
  resetPostAuthSyncFeedback,
  showPostAuthReadyFeedback,
} from "@/lib/postAuthSyncFeedback";
import type { ThemeMode } from "@/utils/themeAuto";
import { normalizeTapSoundVariant } from "@/ui/setup/pages/SocialFlow/utils/tapSound";

type CloudSnapshot = {
  settings: any;
  profiles: any[];
  customLinks: any[];
  friendsFilters: any[];
  socialAccounts: any[];
  activeAccounts: any[];
};

let hydratedUserId: string | null = null;
let hydratePromise: Promise<void> | null = null;
const REOPEN_SETTINGS_AFTER_AUTH_KEY = "sfz_reopen_settings_after_auth";
const CLOUD_SYNC_USER_ID_KEY = "sfz_cloud_sync_user_id";
const AUTH_RELOAD_DELAY_MS = 3000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getRememberedCloudUserId() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(CLOUD_SYNC_USER_ID_KEY);
}

function rememberCloudUserId(userId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(CLOUD_SYNC_USER_ID_KEY, userId);
}

function clearRememberedCloudUserId() {
  if (!canUseStorage()) return;
  localStorage.removeItem(CLOUD_SYNC_USER_ID_KEY);
}

function isCloudSnapshotEmpty(snapshot: CloudSnapshot) {
  return !snapshot.settings
    && snapshot.profiles.length === 0
    && snapshot.customLinks.length === 0
    && snapshot.friendsFilters.length === 0
    && snapshot.socialAccounts.length === 0
    && snapshot.activeAccounts.length === 0;
}

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

function clearCloudBackedLocalState() {
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
  onboardingStore.completed = false;

  localStorage.removeItem("user-locale");
  localStorage.removeItem("theme");
  localStorage.removeItem("grayscale");
  localStorage.removeItem("sfz_haptic");
  localStorage.removeItem("sfz_tap_sound");
  localStorage.removeItem("sfz_tap_sound_variant");
  localStorage.removeItem("sfz_text_zoom");
  clearCloudSyncQueue();
}

function applyCloudSnapshot(snapshot: CloudSnapshot) {
  const profilesStore = useProfilesStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const accountsStore = useAccountsStore();

  applyCloudSettings(snapshot.settings);
  profilesStore.replaceFromCloud(snapshot.profiles, snapshot.settings?.activeProfileId);
  customLinksStore.replaceFromCloud(snapshot.customLinks);
  friendsStore.replaceFromCloud(
    snapshot.friendsFilters,
    snapshot.settings?.friendsFilterEnabled ?? false,
  );
  accountsStore.replaceFromCloud(snapshot.socialAccounts, snapshot.activeAccounts);
}

async function seedCloudFromLocalIfEmpty(snapshot: CloudSnapshot) {
  const profilesStore = useProfilesStore();
  const customLinksStore = useCustomLinksStore();
  const friendsStore = useFriendsFilterStore();
  const accountsStore = useAccountsStore();
  const themeStore = useThemeStore();
  const onboardingStore = useOnboardingStore();

  if (!snapshot.settings) {
    await syncSettingsPatch({
      theme: themeStore.themeMode as ThemeMode,
      language: localStorage.getItem("user-locale") ?? "fr",
      grayscaleEnabled: themeStore.grayscaleEnabled,
      textZoom: Number(localStorage.getItem("sfz_text_zoom") ?? "100"),
      hapticEnabled: localStorage.getItem("sfz_haptic") !== "false",
      tapSoundEnabled: localStorage.getItem("sfz_tap_sound") === "true",
      tapSoundVariant: normalizeTapSoundVariant(localStorage.getItem("sfz_tap_sound_variant")),
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

export async function hydrateCloudState(options?: {
  allowLocalSeedIfEmpty?: boolean;
}) {
  if (!isAuthenticated.value) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const client = getConvexClient();
    const user = await client.query(api.users.getMe, {});
    if (!user?._id) return;
    if (hydratedUserId === user._id) return;

    const rememberedUserId = getRememberedCloudUserId();
    const isAnonymousUser = user.isAnonymous === true;
    const canReuseLocalState = isAnonymousUser || rememberedUserId === user._id;

    if (canReuseLocalState) {
      await flushCloudSyncQueue();
    } else {
      clearCloudSyncQueue();
    }

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
    const snapshot: CloudSnapshot = {
      settings,
      profiles,
      customLinks,
      friendsFilters,
      socialAccounts,
      activeAccounts,
    };

    await advancePostAuthSyncStage("dataReceived");

    const shouldKeepLocalIfCloudEmpty =
      canReuseLocalState || options?.allowLocalSeedIfEmpty === true;

    if (isCloudSnapshotEmpty(snapshot) && shouldKeepLocalIfCloudEmpty) {
      await seedCloudFromLocalIfEmpty(snapshot);
    } else {
      if (!canReuseLocalState) {
        clearCloudBackedLocalState();
      }
      applyCloudSnapshot(snapshot);
    }
    await advancePostAuthSyncStage("dataApplied");

    hydratedUserId = user._id;
    rememberCloudUserId(user._id);
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

export function resetCloudSyncState() {
  hydratedUserId = null;
  hydratePromise = null;
  resetPostAuthSyncFeedback();
}

export function resetSyncedLocalState() {
  clearCloudBackedLocalState();

  localStorage.removeItem("sfz_email");
  clearRememberedCloudUserId();
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
  flow?: "signIn" | "signUp";
  reload?: boolean;
  reopenSettings?: boolean;
}) {
  beginPostAuthSyncFeedback();

  if (options?.email) {
    localStorage.setItem("sfz_email", options.email);
  }

  try {
    await hydrateCloudState({
      allowLocalSeedIfEmpty: options?.flow === "signUp",
    });

    if (options?.reload ?? true) {
      if (options?.reopenSettings) {
        localStorage.setItem(REOPEN_SETTINGS_AFTER_AUTH_KEY, "1");
      }
      await advancePostAuthSyncStage("restarting");
      queuePostAuthReadyNotice();
      window.setTimeout(() => {
        window.location.reload();
      }, AUTH_RELOAD_DELAY_MS);
      return;
    }

    showPostAuthReadyFeedback();
  } catch (error) {
    resetPostAuthSyncFeedback();
    throw error;
  }
}
