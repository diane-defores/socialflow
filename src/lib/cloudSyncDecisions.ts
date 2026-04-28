export type CloudSnapshotShape = {
  settings: unknown;
  profiles: unknown[];
  customLinks: unknown[];
  friendsFilters: unknown[];
  socialAccounts: unknown[];
  activeAccounts: unknown[];
};

export function isCloudSnapshotEmpty(snapshot: CloudSnapshotShape) {
  return !snapshot.settings
    && snapshot.profiles.length === 0
    && snapshot.customLinks.length === 0
    && snapshot.friendsFilters.length === 0
    && snapshot.socialAccounts.length === 0
    && snapshot.activeAccounts.length === 0;
}

export function canReuseLocalCloudState(options: {
  isAnonymousUser: boolean;
  rememberedUserId: string | null;
  currentUserId: string;
}) {
  return options.isAnonymousUser || options.rememberedUserId === options.currentUserId;
}

export function shouldKeepLocalWhenCloudEmpty(options: {
  canReuseLocalState: boolean;
  allowLocalSeedIfEmpty?: boolean;
}) {
  return options.canReuseLocalState || options.allowLocalSeedIfEmpty === true;
}
