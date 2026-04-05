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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@clerk/vue'
import { initConvexAuth } from '@/lib/convex'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useFriendsFilter } from './composables/useFriendsFilter'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppRightSidebar from './components/AppRightSidebar.vue'
import NetworkWebviewHost from './components/NetworkWebviewHost.vue'
import MobileLayout from './components/MobileLayout.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)

const { locale } = useI18n()
const { getToken } = useAuth()

// Wire Clerk auth into Convex WebSocket client (once, globally).
// All subsequent queries/mutations/subscriptions are automatically authenticated.
initConvexAuth(async (opts) => {
  const tokenFn = getToken.value
  if (typeof tokenFn !== 'function') return null
  return tokenFn(opts)
})

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
useFriendsFilter() // Activates watchers: injects filter into webviews when settings change

// Mobile detection — reactive on window resize
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

let unlistenTray: (() => void) | undefined

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Sync locale to Android plugin for native UI translations
watch(locale, async (newLocale) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_locale', { locale: newLocale }).catch(() => {})
}, { immediate: true })

// When the settings toggle changes, sync the native webview on Android
watch(() => themeStore.grayscaleEnabled, async (enabled) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_grayscale', { enabled }).catch(() => {})
})

// Sync dark mode state to native Android bottom bar
watch(() => themeStore.isDarkMode, async (enabled) => {
  if (!isTauri) return
  const { invoke } = await import('@tauri-apps/api/core')
  invoke('set_dark_mode', { enabled }).catch(() => {})
})

// Sync profile list to Android popup menu whenever profiles or active profile changes.
// Use a lightweight computed fingerprint instead of deep: true (avoids traversing base64 avatars).
const profilesFingerprint = computed(() =>
  profilesStore.profiles.map(p => `${p.id}:${p.name}:${p.emoji}`).join('|')
)
watch(
  [profilesFingerprint, () => profilesStore.activeProfileId],
  async ([_, activeId]) => {
    if (!isTauri) return
    const { invoke } = await import('@tauri-apps/api/core')
    const profilesJson = JSON.stringify(profilesStore.profiles.map(p => ({ id: p.id, name: p.name, emoji: p.emoji })))
    invoke('set_profiles', { profilesJson, activeProfileId: activeId }).catch(() => {})
  },
  { immediate: true },
)

onMounted(async () => {
  themeStore.initTheme()
  profilesStore.ensureDefault()

  window.addEventListener('resize', handleResize)

  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    // Edge-to-edge: transparent status bar, content extends to top of screen
    invoke('setup_display').catch(() => {})
    // Sync initial dark mode state to native bar
    invoke('set_dark_mode', { enabled: themeStore.isDarkMode }).catch(() => {})

    // Tray events use Rust Emitter.emit() → listen() from @tauri-apps/api/event
    const { listen } = await import('@tauri-apps/api/event')
    unlistenTray = await listen<string>('tray:open-network', ({ payload: networkId }) => {
      profilesStore.ensureDefault()
      webviewStore.selectNetwork(networkId)
    })
  }

  // Kotlin bottom bar communicates via CustomEvents dispatched on the main Tauri WebView.
  // This uses evaluateJavascript() — the same proven mechanism as grayscale/mute injection.
  // (Plugin trigger() + addPluginListener was unreliable in production.)
  window.addEventListener('sfz-webview-back', () => {
    webviewStore.clearNetwork()
  })
  window.addEventListener('sfz-grayscale-changed', ((e: CustomEvent) => {
    themeStore.setGrayscale(e.detail.enabled)
  }) as EventListener)

  // Popup menu: open profile sheet (Kotlin dispatches this when user taps "Changer de profil")
  window.addEventListener('sfz-open-profile-sheet', () => {
    // Close the webview first, then the profile sheet is shown by MobileLayout
    webviewStore.clearNetwork()
    // Small delay so MobileLayout renders before we trigger the sheet
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sfz-show-profile-sheet'))
    }, 100)
  })

  // Popup menu: inline profile switch (Kotlin dispatches this with { profileId })
  window.addEventListener('sfz-switch-profile', ((e: CustomEvent) => {
    const { profileId } = e.detail
    if (profileId && profileId !== profilesStore.activeProfileId) {
      profilesStore.setActive(profileId)
      // Reload the current network with the new profile's session
      const networkId = webviewStore.activeNetworkId
      if (networkId) {
        webviewStore.clearNetwork()
        setTimeout(() => webviewStore.selectNetwork(networkId), 100)
      }
    }
  }) as EventListener)

  // Popup menu: toggle dark mode (Kotlin dispatches this)
  window.addEventListener('sfz-toggle-dark-mode', () => {
    themeStore.toggleTheme()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  unlistenTray?.()
})
</script>

<style>
* {
  -webkit-user-select: none;
  user-select: none;
}

input, textarea, [contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}

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

/* Dark theme — html.dark beats PrimeVue's :root (specificity 0,1,1 > 0,1,0) */
html.dark {
  color-scheme: dark;

  --primary-color: #5BA8F5;
  --text-color: #e4e4e7;
  --text-color-secondary: #a1a1aa;
  --surface-ground: #09090b;
  --surface-card: #18181b;
  --surface-border: #27272a;
  --surface-hover: #27272a;
  --card-shadow: 0 2px 4px rgba(0,0,0,.6);

  /* Override PrimeVue surface scale */
  --surface-a: #18181b;
  --surface-b: #18181b;
  --surface-c: #27272a;
  --surface-d: #3f3f46;
  --surface-e: #18181b;
  --surface-f: #18181b;
  --surface-section: #09090b;
  --surface-overlay: #18181b;
  --surface-0: #09090b;
  --surface-50: #18181b;
  --surface-100: #27272a;
  --surface-200: #3f3f46;
  --surface-300: #52525b;
  --surface-400: #71717a;
  --surface-500: #a1a1aa;
  --surface-600: #d4d4d8;
  --surface-700: #e4e4e7;
  --surface-800: #f4f4f5;
  --surface-900: #fafafa;
  --focus-ring: 0 0 0 0.2rem rgba(91,168,245,0.4);
  --highlight-bg: rgba(91,168,245,0.16);
  --highlight-text-color: #93c5fd;
  --maskbg: rgba(0, 0, 0, 0.6);
}

body {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-color);
  background: var(--surface-ground);
}

/* Ensure body dark bg beats any PrimeVue body rules */
html.dark body {
  background: var(--surface-ground);
  color: var(--text-color);
}
</style>
