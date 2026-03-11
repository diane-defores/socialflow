<template>
  <!-- Transparent host div — the native Tauri webview floats on top -->
  <div ref="hostEl" class="webview-host">
    <!-- Dev-mode placeholder (running in browser, not Tauri) -->
    <div v-if="!isTauri" class="dev-placeholder">
      <div class="placeholder-content">
        <i class="pi pi-desktop" style="font-size: 3rem; opacity: 0.3" />
        <p><strong>{{ webviewStore.activeNetworkId }}</strong></p>
        <p>{{ profilesStore.activeProfile?.emoji }} {{ profilesStore.activeProfile?.name ?? 'No profile' }}</p>
        <p class="hint">Native webview renders here in the Tauri desktop app.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWebviewStore } from '@/stores/webviewState'
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
    } else if (!prevNetworkId && !prevProfileId) {
      await open(url, profileId, networkId)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const url = activeUrl.value
  const networkId = activeNetworkId.value
  const profileId = activeProfileId.value
  if (url && networkId && profileId) {
    await open(url, profileId, networkId)
  }
})
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

.hint {
  font-size: 0.85rem;
  opacity: 0.6;
}
</style>
