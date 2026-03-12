import { useProfilesStore } from '@/stores/profiles'
import { useAccountsStore } from '@/stores/accounts'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useThemeStore } from '@/stores/theme'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Gather all persisted store + localStorage data into a single JSON string. */
function collectStoreData(): string {
  const profiles = useProfilesStore()
  const accounts = useAccountsStore()
  const friends = useFriendsFilterStore()
  const theme = useThemeStore()

  const data = {
    profiles: {
      profiles: profiles.profiles,
      activeProfileId: profiles.activeProfileId,
    },
    accounts: {
      accounts: accounts.accounts,
      activeAccountId: accounts.activeAccountId,
    },
    friendsFilter: {
      friends: friends.friends,
      enabled: friends.enabled,
    },
    theme: {
      isDarkMode: theme.isDarkMode,
      grayscaleEnabled: theme.grayscaleEnabled,
    },
    localStorage: {
      sfz_username: localStorage.getItem('sfz_username') ?? '',
      sfz_email: localStorage.getItem('sfz_email') ?? '',
    },
  }
  return JSON.stringify(data)
}

/** Apply restored data to all stores + localStorage. */
function applyStoreData(json: string) {
  const data = JSON.parse(json)

  if (data.profiles) {
    const store = useProfilesStore()
    store.$patch({
      profiles: data.profiles.profiles ?? [],
      activeProfileId: data.profiles.activeProfileId ?? '',
    })
  }

  if (data.accounts) {
    const store = useAccountsStore()
    store.$patch({
      accounts: data.accounts.accounts ?? [],
      activeAccountId: data.accounts.activeAccountId ?? {},
    })
  }

  if (data.friendsFilter) {
    const store = useFriendsFilterStore()
    store.friends = data.friendsFilter.friends ?? {}
    store.enabled = data.friendsFilter.enabled ?? {}
  }

  if (data.theme) {
    const store = useThemeStore()
    store.$patch({
      isDarkMode: data.theme.isDarkMode ?? false,
      grayscaleEnabled: data.theme.grayscaleEnabled ?? false,
    })
    store.applyTheme()
    store.applyGrayscale()
  }

  if (data.localStorage) {
    if (data.localStorage.sfz_username)
      localStorage.setItem('sfz_username', data.localStorage.sfz_username)
    if (data.localStorage.sfz_email)
      localStorage.setItem('sfz_email', data.localStorage.sfz_email)
  }
}

export function useBackup() {
  async function exportBackup(password: string): Promise<string> {
    if (!isTauri) throw new Error('Export is only available in the desktop/mobile app')
    const { invoke } = await import('@tauri-apps/api/core')
    const storeData = collectStoreData()
    return invoke<string>('export_backup', { storeData, password })
  }

  async function importBackup(password: string): Promise<void> {
    if (!isTauri) throw new Error('Import is only available in the desktop/mobile app')
    const { invoke } = await import('@tauri-apps/api/core')
    const restoredData = await invoke<string>('import_backup', { password })
    applyStoreData(restoredData)
  }

  return { exportBackup, importBackup, isTauri }
}
