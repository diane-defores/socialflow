import { ref, watch, onUnmounted, type Ref } from 'vue'
import { useElementBounding } from '@vueuse/core'

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function invoke(cmd: string, args?: Record<string, unknown>) {
  if (!isTauri()) return
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke(cmd, args)
}

/**
 * Manages a native Tauri child webview for a (profile, network) pair,
 * positioned over the given host element.
 * Each profile×network gets its own isolated data directory
 * → separate cookies / localStorage / IndexedDB.
 */
export function useNetworkWebview(hostEl: Ref<HTMLElement | null>) {
  const { x, y, width, height } = useElementBounding(hostEl)

  // Track what's currently open as "profileId:networkId"
  const activeKey = ref<string | null>(null)
  const isOpen = ref(false)

  // Keep bounds in sync on sidebar toggle / window resize
  watch([x, y, width, height], async ([nx, ny, nw, nh]) => {
    if (isOpen.value && activeKey.value && nw > 0 && nh > 0) {
      const [profileId, networkId] = activeKey.value.split(':')
      await invoke('resize_webview', {
        profileId,
        networkId,
        x: nx,
        y: ny,
        width: nw,
        height: nh,
      })
    }
  })

  async function open(url: string, profileId: string, networkId: string) {
    await invoke('open_webview', {
      url,
      profileId,
      networkId,
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value,
    })
    activeKey.value = `${profileId}:${networkId}`
    isOpen.value = true
  }

  /**
   * Switch to a different profile or network.
   * Closes the previous webview (session data stays on disk) and opens the new one.
   */
  async function switchTo(url: string, profileId: string, networkId: string) {
    const newKey = `${profileId}:${networkId}`
    if (activeKey.value && activeKey.value !== newKey) {
      const [oldProfileId, oldNetworkId] = activeKey.value.split(':')
      await invoke('close_webview', { profileId: oldProfileId, networkId: oldNetworkId })
      isOpen.value = false
    }
    await open(url, profileId, networkId)
  }

  async function close() {
    if (isOpen.value && activeKey.value) {
      const [profileId, networkId] = activeKey.value.split(':')
      await invoke('close_webview', { profileId, networkId })
      activeKey.value = null
      isOpen.value = false
    }
  }

  onUnmounted(close)

  return { open, switchTo, close, isOpen, activeKey }
}
