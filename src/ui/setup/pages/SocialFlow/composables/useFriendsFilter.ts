import { watch } from 'vue'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { buildFriendsFilterScript } from '@/injectors/friendsFilter'

/**
 * Orchestrates injection of the friends filter into native Tauri webviews.
 *
 * Call once in App.vue to activate global watchers:
 *   - Injects filter 2.5s after a network becomes active (page load delay)
 *   - Re-injects immediately when the global toggle or friends list changes
 */
export function useFriendsFilter() {
  const filterStore = useFriendsFilterStore()
  const webviewStore = useWebviewStore()
  const profilesStore = useProfilesStore()

  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

  async function applyFilter(networkId?: string) {
    const nId = networkId ?? webviewStore.activeNetworkId
    const pId = profilesStore.activeProfileId
    if (!nId || !pId || !webviewStore.usesWebview(nId)) return

    const script = buildFriendsFilterScript(
      nId,
      filterStore.getFriends(nId),
      filterStore.enabled,
    )

    if (!isTauri) return // Dev browser — skip IPC

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('inject_script', { profileId: pId, networkId: nId, script })
    } catch {
      // Webview not open yet — ignore silently
    }
  }

  // Inject (with delay) when a new network becomes active
  watch(
    () => webviewStore.activeNetworkId,
    (nId) => {
      if (!nId) return
      setTimeout(() => applyFilter(nId), 2500)
    },
  )

  // Re-inject when global toggle or friends list changes
  watch(
    () => ({
      enabled: filterStore.enabled,
      friends: webviewStore.activeNetworkId
        ? filterStore.friends[webviewStore.activeNetworkId]
        : null,
    }),
    () => applyFilter(),
    { deep: true },
  )

  return { applyFilter }
}
