import { api } from "../../convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { isAuthenticated, isConvexConfigured } from "@/lib/convexAuth";
import type { CloudSettingsPatch } from "@/lib/cloudSettings";

const STORAGE_KEY = "sfz_cloud_sync_queue_v1";
const RETRY_DELAY_MS = 5000;
const PERIODIC_FLUSH_MS = 15000;

type QueueBase = {
  key: string;
  updatedAt: number;
  attempts: number;
};

type SettingsPatchOperation = QueueBase & {
  type: "settingsPatch";
  patch: CloudSettingsPatch;
};

type ProfileUpsertOperation = QueueBase & {
  type: "profileUpsert";
  profile: {
    profileId: string;
    name: string;
    emoji: string;
    avatar?: string;
    hiddenNetworks: string[];
    createdAt: number;
  };
};

type ProfileRemoveOperation = QueueBase & {
  type: "profileRemove";
  profileId: string;
};

type CustomLinkUpsertOperation = QueueBase & {
  type: "customLinkUpsert";
  link: {
    linkId: string;
    profileId: string;
    label: string;
    url: string;
    icon: string;
  };
};

type CustomLinkRemoveOperation = QueueBase & {
  type: "customLinkRemove";
  linkId: string;
};

type FriendsFilterSetOperation = QueueBase & {
  type: "friendsFilterSet";
  networkId: string;
  names: string[];
};

type SocialAccountUpsertOperation = QueueBase & {
  type: "socialAccountUpsert";
  account: {
    accountId: string;
    networkId: string;
    label: string;
    addedAt: number;
  };
};

type SocialAccountRemoveOperation = QueueBase & {
  type: "socialAccountRemove";
  accountId: string;
};

type SocialAccountSetActiveOperation = QueueBase & {
  type: "socialAccountSetActive";
  networkId: string;
  accountId: string;
};

type CloudSyncOperation =
  | SettingsPatchOperation
  | ProfileUpsertOperation
  | ProfileRemoveOperation
  | CustomLinkUpsertOperation
  | CustomLinkRemoveOperation
  | FriendsFilterSetOperation
  | SocialAccountUpsertOperation
  | SocialAccountRemoveOperation
  | SocialAccountSetActiveOperation;

let flushPromise: Promise<void> | null = null;
let retryTimer: number | null = null;
let started = false;

function now() {
  return Date.now();
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readQueue(): CloudSyncOperation[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: CloudSyncOperation[]) {
  if (!canUseStorage()) return;

  if (queue.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function upsertOperation(queue: CloudSyncOperation[], operation: CloudSyncOperation) {
  const index = queue.findIndex((item) => item.key === operation.key);

  if (index === -1) {
    queue.push(operation);
    return queue;
  }

  const existing = queue[index];

  if (operation.type === "settingsPatch" && existing.type === "settingsPatch") {
    queue[index] = {
      ...existing,
      patch: { ...existing.patch, ...operation.patch },
      updatedAt: operation.updatedAt,
    };
    return queue;
  }

  queue[index] = operation;
  return queue;
}

function scheduleRetry(delayMs = RETRY_DELAY_MS) {
  if (retryTimer) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void flushCloudSyncQueue();
  }, delayMs);
}

function clearRetryTimer() {
  if (!retryTimer) return;
  window.clearTimeout(retryTimer);
  retryTimer = null;
}

function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function canFlushQueue() {
  return isConvexConfigured.value && isAuthenticated.value && isOnline();
}

function removeOperationRevision(queue: CloudSyncOperation[], operation: CloudSyncOperation) {
  return queue.filter((item) => !(item.key === operation.key && item.updatedAt === operation.updatedAt));
}

function bumpOperationAttempts(queue: CloudSyncOperation[], operation: CloudSyncOperation) {
  return queue.map((item) => {
    if (item.key !== operation.key || item.updatedAt !== operation.updatedAt) {
      return item;
    }

    return {
      ...item,
      attempts: item.attempts + 1,
    };
  });
}

async function executeOperation(operation: CloudSyncOperation) {
  const client = getConvexClient();

  switch (operation.type) {
    case "settingsPatch":
      await client.mutation(api.settings.upsert, operation.patch);
      return;
    case "profileUpsert":
      await client.mutation(api.profiles.upsert, operation.profile);
      return;
    case "profileRemove":
      await client.mutation(api.profiles.remove, { profileId: operation.profileId });
      return;
    case "customLinkUpsert":
      await client.mutation(api.customLinks.upsert, operation.link);
      return;
    case "customLinkRemove":
      await client.mutation(api.customLinks.remove, { linkId: operation.linkId });
      return;
    case "friendsFilterSet":
      await client.mutation(api.friendsFilters.setNetwork, {
        networkId: operation.networkId,
        names: operation.names,
      });
      return;
    case "socialAccountUpsert":
      await client.mutation(api.socialAccounts.upsert, operation.account);
      return;
    case "socialAccountRemove":
      await client.mutation(api.socialAccounts.remove, { accountId: operation.accountId });
      return;
    case "socialAccountSetActive":
      await client.mutation(api.socialAccounts.setActive, {
        networkId: operation.networkId,
        accountId: operation.accountId,
      });
      return;
  }
}

function enqueueOperation(operation: CloudSyncOperation) {
  const queue = upsertOperation(readQueue(), operation);
  writeQueue(queue);
  void flushCloudSyncQueue();
}

export function hasPendingCloudSync() {
  return readQueue().length > 0;
}

export async function flushCloudSyncQueue() {
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    if (!canFlushQueue()) {
      if (hasPendingCloudSync()) {
        scheduleRetry();
      }
      return;
    }

    let queue = readQueue();
    if (queue.length === 0) {
      clearRetryTimer();
      return;
    }

    let hadFailure = false;

    for (const operation of queue) {
      try {
        await executeOperation(operation);
        queue = removeOperationRevision(readQueue(), operation);
        writeQueue(queue);
      } catch {
        hadFailure = true;
        queue = bumpOperationAttempts(readQueue(), operation);
        writeQueue(queue);
      }
    }

    if (queue.length > 0 && hadFailure) {
      scheduleRetry();
      return;
    }

    clearRetryTimer();
  })();

  flushPromise.then(
    () => {
      flushPromise = null;
    },
    () => {
      flushPromise = null;
    },
  );

  return flushPromise;
}

export function clearCloudSyncQueue() {
  clearRetryTimer();
  writeQueue([]);
}

export function startCloudSyncQueue() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("online", () => {
    void flushCloudSyncQueue();
  });
  window.addEventListener("focus", () => {
    void flushCloudSyncQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void flushCloudSyncQueue();
    }
  });

  window.setInterval(() => {
    void flushCloudSyncQueue();
  }, PERIODIC_FLUSH_MS);
}

export function enqueueSettingsPatch(patch: CloudSettingsPatch) {
  enqueueOperation({
    type: "settingsPatch",
    key: "settings",
    patch,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueProfileUpsert(profile: {
  profileId: string;
  name: string;
  emoji: string;
  avatar?: string;
  hiddenNetworks: string[];
  createdAt: number;
}) {
  enqueueOperation({
    type: "profileUpsert",
    key: `profile:${profile.profileId}`,
    profile,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueProfileRemove(profileId: string) {
  enqueueOperation({
    type: "profileRemove",
    key: `profile:${profileId}`,
    profileId,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueCustomLinkUpsert(link: {
  linkId: string;
  profileId: string;
  label: string;
  url: string;
  icon: string;
}) {
  enqueueOperation({
    type: "customLinkUpsert",
    key: `customLink:${link.linkId}`,
    link,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueCustomLinkRemove(linkId: string) {
  enqueueOperation({
    type: "customLinkRemove",
    key: `customLink:${linkId}`,
    linkId,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueFriendsFilterSet(networkId: string, names: string[]) {
  enqueueOperation({
    type: "friendsFilterSet",
    key: `friendsFilter:${networkId}`,
    networkId,
    names,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueSocialAccountUpsert(account: {
  accountId: string;
  networkId: string;
  label: string;
  addedAt: number;
}) {
  enqueueOperation({
    type: "socialAccountUpsert",
    key: `socialAccount:${account.accountId}`,
    account,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueSocialAccountRemove(accountId: string) {
  enqueueOperation({
    type: "socialAccountRemove",
    key: `socialAccount:${accountId}`,
    accountId,
    updatedAt: now(),
    attempts: 0,
  });
}

export function enqueueSocialAccountSetActive(networkId: string, accountId: string) {
  enqueueOperation({
    type: "socialAccountSetActive",
    key: `activeSocialAccount:${networkId}`,
    networkId,
    accountId,
    updatedAt: now(),
    attempts: 0,
  });
}
