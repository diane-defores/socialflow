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

/** Convert a base64 string to Uint8Array. */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Convert Uint8Array to base64 string. */
function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function useBackup() {
  async function exportBackup(password: string): Promise<string> {
    if (!isTauri) throw new Error('Export is only available in the desktop/mobile app')

    const { invoke } = await import('@tauri-apps/api/core')
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')

    // 1. Rust creates the encrypted blob, returns base64
    const storeData = collectStoreData()
    const b64: string = await invoke('create_backup', { storeData, password })

    // 2. Native save dialog (handles content:// URIs on Android)
    const filePath = await save({
      defaultPath: 'socialflow-backup.sfbak',
      filters: [{ name: 'SocialFlow Backup', extensions: ['sfbak'] }],
    })
    if (!filePath) throw new Error('No file selected')

    // 3. Write via plugin-fs (handles content:// URIs transparently)
    await writeFile(filePath, b64ToBytes(b64))

    return typeof filePath === 'string' ? filePath : filePath.toString()
  }

  async function importBackup(password: string): Promise<void> {
    if (!isTauri) throw new Error('Import is only available in the desktop/mobile app')

    const { invoke } = await import('@tauri-apps/api/core')
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readFile } = await import('@tauri-apps/plugin-fs')

    // Native open dialog
    const filePath = await open({
      filters: [{ name: 'SocialFlow Backup', extensions: ['sfbak'] }],
    })
    if (!filePath) throw new Error('No file selected')

    // Read via plugin-fs (handles content:// URIs transparently)
    const bytes = await readFile(filePath)

    // Send base64 to Rust for decryption + session restore
    const encryptedB64 = bytesToB64(bytes)
    const restoredData = await invoke<string>('restore_backup', {
      encryptedB64,
      password,
    })

    applyStoreData(restoredData)
  }

  return { exportBackup, importBackup, isTauri }
}