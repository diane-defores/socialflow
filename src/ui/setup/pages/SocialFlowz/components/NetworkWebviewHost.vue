<template>
  <!-- Transparent host div — the native Tauri webview floats on top -->
  <div ref="hostEl" class="webview-host">
    <!-- Dev-mode placeholder (running in browser, not Tauri) -->
    <div v-if="!isTauri" class="dev-placeholder">
      <div class="placeholder-content">
        <i class="pi pi-desktop" style="font-size: 3rem; opacity: 0.3" />
        <p><strong>{{ webviewStore.activeNetworkId }}</strong></p>
        <p>{{ activeAccount?.label ?? 'No account' }}</p>
        <p class="hint">Native webview renders here in the Tauri desktop app.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWebviewStore } from '@/stores/webviewState'
import { useAccountsStore } from '@/stores/accounts'
import { useNetworkWebview } from '../composables/useNetworkWebview'

const webviewStore = useWebviewStore()
const accountsStore = useAccountsStore()
const hostEl = ref<HTMLElement | null>(null)
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const { open, switchAccount, close } = useNetworkWebview(hostEl)

const activeAccount = computed(() =>
  webviewStore.activeNetworkId
    ? accountsStore.getActive(webviewStore.activeNetworkId)
    : undefined,
)

const activeUrl = computed(() => webviewStore.activeUrl)

// React to network/account changes — open or switch the webview
watch(
  [activeUrl, activeAccount],
  async ([url, account], [prevUrl, prevAccount]) => {
    if (!url || !account) {
      await close()
      return
    }
    if (prevAccount && prevAccount.id !== account.id) {
      await switchAccount(url, account.id)
    } else if (url !== prevUrl || !prevAccount) {
      await open(url, account.id)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (activeUrl.value && activeAccount.value) {
    await open(activeUrl.value, activeAccount.value.id)
  }
})
</script>

<style scoped>
.webview-host {
  flex: 1;
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
}

.dev-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
}

.placeholder-content {
  text-align: center;
  padding: 2rem;
}

.placeholder-content p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.6;
}
</style>
