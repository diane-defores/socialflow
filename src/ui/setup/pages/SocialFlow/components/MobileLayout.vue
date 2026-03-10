<template>
  <!-- Webview active: fullscreen webview host + bottom overlay bar -->
  <div v-if="webviewStore.activeUrl" class="mobile-webview-screen">
    <!-- Host div fills the available space above the bottom bar -->
    <NetworkWebviewHost class="mobile-webview-host" />

    <div class="mobile-overlay-bar">
      <button class="overlay-btn overlay-back" @click="goBack" aria-label="Retour">
        <i class="pi pi-arrow-left" />
      </button>

      <div class="overlay-current-network">
        <i :class="currentNetwork?.icon" />
        <span>{{ currentNetwork?.label }}</span>
      </div>

      <div class="overlay-network-switcher">
        <button
          v-for="item in webviewNetworks"
          :key="item.id"
          class="overlay-btn overlay-network-btn"
          :class="{ active: isNetworkActive(item) }"
          :aria-label="item.label"
          v-tooltip.top="item.label"
          @click="navigateToNetwork(item)"
        >
          <i :class="item.icon" />
        </button>
      </div>
    </div>
  </div>

  <!-- Default view: profile on top, network grid on bottom -->
  <div v-else class="mobile-home">
    <!-- Profile section (top) -->
    <div class="mobile-profile-section">
      <ProfileSwitcher :iconsOnly="false" />

      <div class="mobile-menu-buttons">
        <button class="mobile-menu-btn">
          <i class="pi pi-home" /><span>Fil d'actualité</span>
        </button>
        <button class="mobile-menu-btn">
          <i class="pi pi-user" /><span>Profil</span>
        </button>
        <button class="mobile-menu-btn">
          <i class="pi pi-users" /><span>Amis</span>
        </button>
        <button class="mobile-menu-btn">
          <i class="pi pi-bell" /><span>Notifications</span>
          <span class="badge">3</span>
        </button>
        <button class="mobile-menu-btn">
          <i class="pi pi-bookmark" /><span>Enregistrements</span>
        </button>
        <button class="mobile-menu-btn">
          <i class="pi pi-calendar" /><span>Événements</span>
        </button>
      </div>
    </div>

    <!-- Network grid (bottom) -->
    <div class="mobile-network-section">
      <h3 class="section-title">Réseaux sociaux</h3>
      <div class="network-grid">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="network-tile"
          :class="{ active: isNetworkActive(item) }"
          @click="navigateToNetwork(item)"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import type { MenuItem } from '../types'
import ProfileSwitcher from './ProfileSwitcher.vue'
import NetworkWebviewHost from './NetworkWebviewHost.vue'

const router = useRouter()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()

const menuItems = ref<MenuItem[]>([
  { id: 1, label: 'Twitter', icon: 'pi pi-twitter', route: '/twitter' },
  { id: 2, label: 'Facebook', icon: 'pi pi-facebook', route: '/facebook' },
  { id: 3, label: 'Instagram', icon: 'pi pi-instagram', route: '/instagram' },
  { id: 4, label: 'LinkedIn', icon: 'pi pi-linkedin', route: '/linkedin' },
  { id: 5, label: 'TikTok', icon: 'pi pi-video', route: '/tiktok' },
  { id: 6, label: 'Threads', icon: 'pi pi-at', route: '/threads' },
  { id: 7, label: 'Discord', icon: 'pi pi-discord', route: '/discord' },
  { id: 8, label: 'Reddit', icon: 'pi pi-reddit', route: '/reddit' },
  { id: 9, label: 'Gmail', icon: 'pi pi-envelope', route: '/gmail' },
  { id: 10, label: 'Kanban', icon: 'pi pi-th-large', route: '/kanban' },
])

// Only webview-capable networks for the quick-switch bar
const webviewNetworks = computed(() =>
  menuItems.value.filter(item => webviewStore.usesWebview(item.route.slice(1)))
)

const currentNetwork = computed(() =>
  menuItems.value.find(item => item.route.slice(1) === webviewStore.activeNetworkId)
)

const isNetworkActive = (item: MenuItem) =>
  webviewStore.activeNetworkId === item.route.slice(1)

const navigateToNetwork = (network: MenuItem) => {
  const networkId = network.route.slice(1)
  if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }
}

const goBack = () => {
  webviewStore.clearNetwork()
}
</script>

<style scoped>
/* ─── Webview screen ─────────────────────────────────────────── */

.mobile-webview-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* Overlay bar sits BELOW the native webview, at the bottom of the screen */
.mobile-overlay-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 3.25rem;
  padding: 0 0.75rem;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  z-index: 100;
}

.overlay-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.overlay-btn:hover,
.overlay-btn:active {
  background-color: var(--surface-hover);
}

.overlay-back {
  font-size: 1.1rem;
}

.overlay-current-network {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  flex-shrink: 0;
}

.overlay-current-network i {
  font-size: 1rem;
  color: var(--primary-color);
}

/* Scrollable quick-switch network icons */
.overlay-network-switcher {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  margin-left: auto;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.overlay-network-switcher::-webkit-scrollbar {
  display: none;
}

.overlay-network-btn {
  font-size: 1rem;
  width: 2.25rem;
  height: 2.25rem;
}

.overlay-network-btn.active {
  background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
  color: var(--primary-color);
}

/* The webview host fills the space above the bottom overlay bar */
.mobile-webview-host {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

/* ─── Home screen ────────────────────────────────────────────── */

.mobile-home {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* Profile section */
.mobile-profile-section {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.mobile-menu-buttons {
  display: flex;
  flex-direction: column;
}

.mobile-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  text-align: left;
  width: 100%;
  position: relative;
  transition: background-color 0.15s;
}

.mobile-menu-btn:hover,
.mobile-menu-btn:active {
  background-color: var(--surface-hover);
}

.mobile-menu-btn i {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  width: 1.25rem;
  flex-shrink: 0;
}

.mobile-menu-btn .badge {
  position: absolute;
  right: 1.25rem;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 1rem;
  line-height: 1.4;
}

/* Network section */
.mobile-network-section {
  flex: 1;
  padding: 1rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.network-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 0.9rem 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-color);
  transition: background-color 0.15s, transform 0.1s;
}

.network-tile i {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
}

.network-tile.active {
  background-color: color-mix(in srgb, var(--primary-color) 12%, transparent);
  border-color: var(--primary-color);
}

.network-tile.active i {
  color: var(--primary-color);
}

.network-tile:hover,
.network-tile:active {
  background-color: var(--surface-hover);
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .overlay-btn,
  .mobile-menu-btn,
  .network-tile {
    transition: none;
  }
}
</style>
