<template>
  <div class="app-container">
    <!-- Onboarding (first launch) -->
    <OnboardingFlow v-if="!onboardingStore.completed" />

    <!-- Mobile layout (≤768px): single-column, no panels -->
    <MobileLayout v-else-if="isMobile" />

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

    <!-- Desktop signup nudge (Dialog mode) -->
    <SignupNudge
      v-model="nudgeVisible"
      @dismiss="nudge.dismiss()"
      @account-created="nudge.onAccountCreated()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useOnboardingStore } from '@/stores/onboarding'
import { useFriendsFilter } from './composables/useFriendsFilter'
import { preloadWebviews } from './composables/useWebviewPreload'
import { useSignupNudge } from '@/composables/useSignupNudge'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppRightSidebar from './components/AppRightSidebar.vue'
import NetworkWebviewHost from './components/NetworkWebviewHost.vue'
import MobileLayout from './components/MobileLayout.vue'
import SignupNudge from './components/SignupNudge.vue'
import OnboardingFlow from './components/OnboardingFlow.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)

// Signup nudge (desktop only — mobile has its own in MobileLayout)
const nudge = useSignupNudge()
const nudgeVisible = ref(false)

const { locale } = useI18n()

const themeStore = useThemeStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()
useFriendsFilter() // Activates watchers: injects filter into webviews when settings change

// Mobile detection — reactive on window resize
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

let unlistenTray: (() => void) | undefined

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Event handlers declared at module scope so onUnmounted can remove them
const onWebviewBack = () => { webviewStore.clearNetwork() }
const onGrayscaleChanged = ((e: CustomEvent) => {
  themeStore.setGrayscale(e.detail.enabled)
}) as unknown as (e: Event) => void
const onOpenProfileSheet = () => {
  webviewStore.clearNetwork()
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('sfz-show-profile-sheet'))
  }, 100)
}
const onSwitchProfile = ((e: CustomEvent) => {
  const { profileId } = e.detail
  if (profileId && profileId !== profilesStore.activeProfileId) {
    profilesStore.setActive(profileId)
    const networkId = webviewStore.activeNetworkId
    if (networkId) {
      webviewStore.clearNetwork()
      setTimeout(() => webviewStore.selectNetwork(networkId), 100)
    }
  }
}) as unknown as (e: Event) => void
const onToggleDarkMode = () => { themeStore.toggleTheme() }

// Global tap feedback — delegated to the native plugin so it honors
// the same hapticEnabled / tapSoundEnabled flags as the Kotlin bottom bar.
// Throttled to 50ms to avoid double-fire on fast repeat taps.
let lastTapAt = 0
const onGlobalTap = (e: Event) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  const trigger = target.closest(
    'button, [role="button"], a[role="button"], .sfz-tap, input[type="button"], input[type="submit"], label[for]',
  ) as HTMLElement | null
  if (!trigger) return
  if (trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') return
  if (trigger.closest('[data-no-haptic]')) return
  const now = performance.now()
  if (now - lastTapAt < 50) return
  lastTapAt = now
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|trigger_haptic').catch(() => {})
  }).catch(() => {})
}

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

// Sync the per-profile visible networks to the Android bottom bar.
// Re-fires when the active profile changes or its hiddenNetworks list is edited.
const hiddenFingerprint = computed(() => {
  const p = profilesStore.activeProfile
  return p ? `${p.id}:${(p.hiddenNetworks ?? []).join(',')}` : ''
})
watch(
  hiddenFingerprint,
  async () => {
    if (!isTauri) return
    const profileId = profilesStore.activeProfileId
    if (!profileId) return
    const visibleIds = Object.keys(WEBVIEW_URLS)
      .filter(id => !profilesStore.isNetworkHidden(profileId, id))
    const { invoke } = await import('@tauri-apps/api/core')
    invoke('set_bar_networks', { networkIds: visibleIds }).catch(() => {})
  },
  { immediate: true },
)

onMounted(async () => {
  themeStore.initTheme()
  profilesStore.ensureDefault()

  // Preload top networks off-screen so first click is instant (non-blocking)
  preloadWebviews()

  // Signup nudge (desktop only — mobile uses MobileLayout's own nudge)
  if (!isMobile.value) {
    nudge.recordFirstLaunch()
    await nudge.check()
    if (nudge.showNudge.value) {
      nudgeVisible.value = true
    }
  }

  window.addEventListener('resize', handleResize)

  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    // Edge-to-edge: transparent status bar, content extends to top of screen
    invoke('setup_display').catch(() => {})
    // Sync initial dark mode state to native bar
    invoke('set_dark_mode', { enabled: themeStore.isDarkMode }).catch(() => {})
    // Sync initial text zoom to native webview
    const savedZoom = Number(localStorage.getItem('sfz_text_zoom') ?? '100')
    if (savedZoom !== 100) {
      invoke('set_text_zoom', { level: savedZoom }).catch(() => {})
    }
    // Sync initial haptic + tap sound preferences to native plugin
    // (Kotlin defaults to haptic=on, tapSound=off — resync if user changed them)
    const savedHaptic = localStorage.getItem('sfz_haptic') !== 'false'
    const savedTapSound = localStorage.getItem('sfz_tap_sound') === 'true'
    invoke('plugin:android-webview|set_haptic', { enabled: savedHaptic }).catch(() => {})
    if (savedTapSound) {
      invoke('plugin:android-webview|set_tap_sound', { enabled: true }).catch(() => {})
    }

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
  window.addEventListener('sfz-webview-back', onWebviewBack)
  window.addEventListener('sfz-grayscale-changed', onGrayscaleChanged)
  window.addEventListener('sfz-open-profile-sheet', onOpenProfileSheet)
  window.addEventListener('sfz-switch-profile', onSwitchProfile)
  window.addEventListener('sfz-toggle-dark-mode', onToggleDarkMode)

  // Global haptic/sound feedback for Vue-side buttons.
  // Delegated pointerdown → native plugin respects user's haptic + tap_sound prefs.
  // Opt-out with `data-no-haptic` on an element or ancestor.
  if (isTauri) {
    document.addEventListener('pointerdown', onGlobalTap, { capture: true, passive: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('sfz-webview-back', onWebviewBack)
  window.removeEventListener('sfz-grayscale-changed', onGrayscaleChanged)
  window.removeEventListener('sfz-open-profile-sheet', onOpenProfileSheet)
  window.removeEventListener('sfz-switch-profile', onSwitchProfile)
  window.removeEventListener('sfz-toggle-dark-mode', onToggleDarkMode)
  document.removeEventListener('pointerdown', onGlobalTap, { capture: true } as EventListenerOptions)
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
