<template>
  <!-- Transparent host div — the native Tauri webview floats on top -->
  <div ref="hostEl" class="webview-host">
    <!-- Placeholder when running outside Tauri (web demo, dev mode) -->
    <div v-if="!isTauri" class="dev-placeholder">
      <div class="placeholder-content">
        <i class="pi pi-globe" style="font-size: 3rem; opacity: 0.3" />
        <p class="network-name"><strong>{{ webviewStore.activeNetworkId }}</strong></p>
        <p>{{ profilesStore.activeProfile?.emoji }} {{ profilesStore.activeProfile?.name ?? 'No profile' }}</p>
        <p class="hint">Dans l'application, {{ webviewStore.activeNetworkId }} s'affiche ici dans une WebView native avec ses propres cookies et sa session isolée.</p>
        <a :href="webviewStore.activeUrl ?? '#'" target="_blank" rel="noopener" class="open-link">
          Ouvrir {{ webviewStore.activeNetworkId }} dans un nouvel onglet &rarr;
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useNetworkWebview } from '../composables/useNetworkWebview'

const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const hostEl = ref<HTMLElement | null>(null)
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const { open, switchTo, close } = useNetworkWebview(hostEl)

// Kotlin bottom bar events are handled in App.vue via CustomEvents (evaluateJavascript).
// Network switching is handled entirely in Kotlin (direct loadUrl) — no Vue IPC needed.
// Back/close sends 'sfz-webview-back' CustomEvent → App.vue calls clearNetwork().

const activeUrl = computed(() => webviewStore.activeUrl)
const activeNetworkId = computed(() => webviewStore.activeNetworkId)
const activeProfileId = computed(() => profilesStore.activeProfileId)

/** Send the list of visible webview network IDs to the Android bottom bar. */
async function syncBarNetworks() {
  if (!isTauri) return
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  const allWebviewIds = Object.keys(WEBVIEW_URLS)
  const visibleIds = allWebviewIds.filter(id => !profilesStore.isNetworkHidden(profileId, id))
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_bar_networks', { networkIds: visibleIds })
  } catch { /* no-op on desktop */ }
}

// React to network or profile changes — open or switch the webview
watch(
  [activeUrl, activeNetworkId, activeProfileId],
  async ([url, networkId, profileId], [prevUrl, prevNetworkId, prevProfileId]) => {
    if (!url || !networkId || !profileId) {
      await close()
      return
    }
    const keyChanged =
      networkId !== prevNetworkId || profileId !== prevProfileId || url !== prevUrl
    if (keyChanged && (prevNetworkId || prevProfileId)) {
      await switchTo(url, profileId, networkId)
      syncBarNetworks()
    } else if (!prevNetworkId && !prevProfileId) {
      await open(url, profileId, networkId)
      syncBarNetworks()
    }
  },
  { immediate: true },
)

// The watch({ immediate: true }) above handles the initial open on mount.
// No separate onMounted needed — it would cause a redundant double open_webview IPC.
</script>

<style scoped>
.webview-host {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
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

.network-name {
  font-size: 1.2rem;
  text-transform: capitalize;
}

.hint {
  font-size: 0.85rem;
  opacity: 0.6;
  max-width: 360px;
  line-height: 1.5;
}

.open-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--primary-color, #2196F3);
  border-radius: 0.5rem;
  color: var(--primary-color, #2196F3);
  text-decoration: none;
  font-size: 0.85rem;
  transition: background 0.2s, color 0.2s;
}

.open-link:hover {
  background: var(--primary-color, #2196F3);
  color: #fff;
}
</style>
