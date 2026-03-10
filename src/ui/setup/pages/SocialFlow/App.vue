<template>
  <div class="app-container">
    <!-- Mobile layout (≤768px): single-column, no panels -->
    <MobileLayout v-if="isMobile" />

    <!-- Desktop layout: header + resizable sidebars -->
    <template v-else>
      <AppHeader
        v-model:sidebar-visible="sidebarVisible"
        v-model:right-sidebar-visible="rightSidebarVisible"
      />
      <AppSidebar v-model="sidebarVisible">
        <AppRightSidebar v-model="rightSidebarVisible">
          <!-- Native Tauri webview host: shown when a webview-capable network is active -->
          <NetworkWebviewHost v-if="webviewStore.activeUrl" />
          <!-- Router-view for Gmail (API), login, and other non-webview pages -->
          <router-view v-else />
        </AppRightSidebar>
      </AppSidebar>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppRightSidebar from './components/AppRightSidebar.vue'
import NetworkWebviewHost from './components/NetworkWebviewHost.vue'
import MobileLayout from './components/MobileLayout.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()

// Mobile detection — reactive on window resize
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

let unlistenTray: (() => void) | undefined
let unlistenBack: (() => void) | undefined
let unlistenSwitch: (() => void) | undefined
let unlistenGrayscale: (() => void) | undefined

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// When the settings toggle changes, sync the native webview on Android
watch(() => themeStore.grayscaleEnabled, async (enabled) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_grayscale', { enabled }).catch(() => {})
})

onMounted(async () => {
  themeStore.initTheme()
  profilesStore.ensureDefault()

  window.addEventListener('resize', handleResize)

  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    // Edge-to-edge: transparent status bar, content extends to top of screen
    invoke('setup_display').catch(() => {})

    const { listen } = await import('@tauri-apps/api/event')

    unlistenTray = await listen<string>('tray:open-network', ({ payload: networkId }) => {
      profilesStore.ensureDefault()
      webviewStore.selectNetwork(networkId)
    })

    unlistenBack = await listen('webview-back', () => {
      webviewStore.clearNetwork()
    })

    unlistenSwitch = await listen<{ networkId: string }>('webview-switch-network', ({ payload }) => {
      profilesStore.ensureDefault()
      webviewStore.selectNetwork(payload.networkId)
    })

    // Android native button toggled grayscale → sync store (which applies CSS to Vue UI)
    unlistenGrayscale = await listen<{ enabled: boolean }>('grayscale-changed', ({ payload }) => {
      themeStore.setGrayscale(payload.enabled)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  unlistenTray?.()
  unlistenBack?.()
  unlistenSwitch?.()
  unlistenGrayscale?.()
})
</script>

<style>
.app-container {
  height: 100vh;
  overflow: hidden;
}

:root {
  /* Brand */
  --primary-color: #2196F3;

  /* Light theme surfaces */
  --text-color: #495057;
  --text-color-secondary: #6c757d;
  --surface-ground: #f8f9fa;
  --surface-card: #ffffff;
  --surface-border: #dee2e6;
  --surface-hover: #e9ecef;
  --card-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

/* Dark theme */
.dark {
  --text-color: #dee2e6;
  --text-color-secondary: #9da5ae;
  --surface-ground: #1e1e2e;
  --surface-card: #28283e;
  --surface-border: #3d3d5c;
  --surface-hover: #35354f;
  --card-shadow: 0 2px 1px -1px rgba(0,0,0,.5), 0 1px 1px 0 rgba(0,0,0,.4), 0 1px 3px 0 rgba(0,0,0,.4);
}

body {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-color);
  background: var(--surface-ground);
}
</style>
