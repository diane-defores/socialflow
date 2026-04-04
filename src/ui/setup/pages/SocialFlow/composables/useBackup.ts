import { useProfilesStore } from '@/stores/profiles'
import { useAccountsStore } from '@/stores/accounts'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useThemeStore } from '@/stores/theme'
import { useCustomLinksStore } from '@/stores/customLinks'
import { setLocale } from '@/utils/i18n'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Gather all persisted store + localStorage data into a single JSON string. */
function collectStoreData(): string {
  const profiles = useProfilesStore()
  const accounts = useAccountsStore()
  const friends = useFriendsFilterStore()
  const theme = useThemeStore()
  const customLinks = useCustomLinksStore()

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
    customLinks: {
      links: customLinks.links,
    },
    localStorage: {
      sfz_username: localStorage.getItem('sfz_username') ?? '',
      sfz_email: localStorage.getItem('sfz_email') ?? '',
      'user-locale': localStorage.getItem('user-locale') ?? 'fr',
      theme: localStorage.getItem('theme') ?? 'light',
      grayscale: localStorage.getItem('grayscale') ?? '0',
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

  if (data.customLinks) {
    const store = useCustomLinksStore()
    store.links = data.customLinks.links ?? {}
  }

  if (data.localStorage) {
    if (data.localStorage.sfz_username)
      localStorage.setItem('sfz_username', data.localStorage.sfz_username)
    if (data.localStorage.sfz_email)
      localStorage.setItem('sfz_email', data.localStorage.sfz_email)
    if (data.localStorage['user-locale']) {
      localStorage.setItem('user-locale', data.localStorage['user-locale'])
      setLocale(data.localStorage['user-locale'])
    }
    if (data.localStorage.theme)
      localStorage.setItem('theme', data.localStorage.theme)
    if (data.localStorage.grayscale)
      localStorage.setItem('grayscale', data.localStorage.grayscale)
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
    const { writeFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs')

    // 1. Rust creates the encrypted blob, returns base64
    const storeData = collectStoreData()
    const b64: string = await invoke('create_backup', { storeData, password })

    const isAndroid = navigator.userAgent.includes('Android')
    const fileName = `socialflow-backup-${Date.now()}.sfbak`

    if (isAndroid) {
      // Android: save directly to app data (no file picker needed)
      await mkdir('backups', { baseDir: BaseDirectory.AppData, recursive: true })
      const filePath = `backups/${fileName}`
      await writeFile(filePath, b64ToBytes(b64), { baseDir: BaseDirectory.AppData })
      return filePath
    }

    // Desktop: show native save dialog
    const { save } = await import('@tauri-apps/plugin-dialog')
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'SocialFlow Backup', extensions: ['sfbak'] }],
    })
    if (!filePath) throw new Error('No file selected')
    await writeFile(filePath, b64ToBytes(b64))
    return String(filePath)
  }

  async function importBackup(password: string): Promise<void> {
    if (!isTauri) throw new Error('Import is only available in the desktop/mobile app')

    const { invoke } = await import('@tauri-apps/api/core')
    const { readFile, readDir, BaseDirectory } = await import('@tauri-apps/plugin-fs')

    const isAndroid = navigator.userAgent.includes('Android')
    let bytes: Uint8Array

    if (isAndroid) {
      // Android: find the most recent backup in app data
      const entries = await readDir('backups', { baseDir: BaseDirectory.AppData })
      const backups = entries.filter(e => e.name?.endsWith('.sfbak')).sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''))
      if (backups.length === 0) throw new Error('No backup found')
      bytes = await readFile(`backups/${backups[0].name}`, { baseDir: BaseDirectory.AppData })
    } else {
      // Desktop: native open dialog
      const { open } = await import('@tauri-apps/plugin-dialog')
      const filePath = await open({
        filters: [{ name: 'SocialFlow Backup', extensions: ['sfbak'] }],
      })
      if (!filePath) throw new Error('No file selected')
      bytes = await readFile(filePath)
    }

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