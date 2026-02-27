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
 * Manages a native Tauri child webview for a specific account, positioned
 * over the given host element. Each account gets its own isolated data
 * directory → separate cookies / localStorage / IndexedDB.
 */
export function useNetworkWebview(hostEl: Ref<HTMLElement | null>) {
  const { x, y, width, height } = useElementBounding(hostEl)
  const activeAccountId = ref<string | null>(null)
  const isOpen = ref(false)

  // Keep bounds in sync on sidebar toggle / window resize
  watch([x, y, width, height], async ([nx, ny, nw, nh]) => {
    if (isOpen.value && activeAccountId.value && nw > 0 && nh > 0) {
      await invoke('resize_webview', {
        accountId: activeAccountId.value,
        x: nx,
        y: ny,
        width: nw,
        height: nh,
      })
    }
  })

  async function open(url: string, accountId: string) {
    await invoke('open_webview', {
      url,
      accountId,
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value,
    })
    activeAccountId.value = accountId
    isOpen.value = true
  }

  /**
   * Switch to a different account. Closes the previous webview (session
   * data stays on disk) and opens the new one.
   */
  async function switchAccount(url: string, newAccountId: string) {
    if (activeAccountId.value && activeAccountId.value !== newAccountId) {
      await invoke('close_webview', { accountId: activeAccountId.value })
      isOpen.value = false
    }
    await open(url, newAccountId)
  }

  async function close() {
    if (isOpen.value && activeAccountId.value) {
      await invoke('close_webview', { accountId: activeAccountId.value })
      activeAccountId.value = null
      isOpen.value = false
    }
  }

  async function deleteSession(accountId: string) {
    await invoke('delete_account_session', { accountId })
  }

  onUnmounted(close)

  return { open, switchAccount, close, deleteSession, isOpen, activeAccountId }
}
