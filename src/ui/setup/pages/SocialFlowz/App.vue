<template>
  <div class="app-container">
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore } from '@/stores/webviewState'
import { useAccountsStore } from '@/stores/accounts'
import { useAuth } from '@clerk/vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppRightSidebar from '@/components/AppRightSidebar.vue'
import NetworkWebviewHost from './components/NetworkWebviewHost.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const accountsStore = useAccountsStore()
const { isSignedIn } = useAuth()

let unlistenTray: (() => void) | undefined

// Load cloud data whenever the user signs in
watch(isSignedIn, async (signedIn) => {
  if (signedIn) {
    await accountsStore.loadFromCloud()
  }
})

onMounted(async () => {
  themeStore.initTheme()

  // Sync cloud data if already signed in on startup
  if (isSignedIn.value) {
    accountsStore.loadFromCloud()
  }

  // Listen for tray menu "open network" events (only in Tauri)
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    const { listen } = await import('@tauri-apps/api/event')
    unlistenTray = await listen<string>('tray:open-network', ({ payload: networkId }) => {
      accountsStore.ensureDefault(networkId)
      webviewStore.selectNetwork(networkId)
    })
  }
})

onUnmounted(() => {
  unlistenTray?.()
})
</script>

<style>
.app-container {
  height: 100vh;
  overflow: hidden;
}

:root {
  --primary-color: #2196F3;
  --text-color: #495057;
  --text-color-secondary: #6c757d;
  --surface-ground: #f8f9fa;
  --surface-card: #ffffff;
  --surface-border: #dee2e6;
  --surface-hover: #e9ecef;
  --card-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
}

body {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-color);
  background: var(--surface-ground);
}
</style>
