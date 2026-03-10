<template>
  <!-- Webview active: transparent host — the native Kotlin overlay covers everything -->
  <div v-if="webviewStore.activeUrl" class="mobile-webview-screen">
    <NetworkWebviewHost class="mobile-webview-host" />
  </div>

  <!-- Home screen -->
  <div v-else class="mobile-home">

    <!-- Profile card -->
    <div class="profile-card" @click="profileMenuVisible = !profileMenuVisible">
      <div class="profile-avatar">{{ profilesStore.activeProfile?.emoji ?? '👤' }}</div>
      <div class="profile-info">
        <span class="profile-name">{{ profilesStore.activeProfile?.name ?? 'Profil' }}</span>
        <span class="profile-sub">Appuyer pour changer</span>
      </div>
      <i class="pi pi-chevron-down profile-chevron" :class="{ rotated: profileMenuVisible }" />
    </div>

    <!-- Profile switcher dropdown -->
    <div v-if="profileMenuVisible" class="profile-dropdown">
      <div
        v-for="profile in profilesStore.profiles"
        :key="profile.id"
        class="profile-option"
        :class="{ active: profile.id === profilesStore.activeProfileId }"
        @click="selectProfile(profile.id)"
      >
        <span class="profile-option-emoji">{{ profile.emoji }}</span>
        <span class="profile-option-name">{{ profile.name }}</span>
        <i v-if="profile.id === profilesStore.activeProfileId" class="pi pi-check" />
      </div>
      <button class="add-profile-btn" @click.stop="addProfile">
        <i class="pi pi-plus" /><span>Nouveau profil</span>
      </button>
    </div>

    <!-- Network list -->
    <div class="networks-section">
      <p class="section-title">Réseaux sociaux</p>
      <div class="network-list">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="network-card"
          :class="{ active: isNetworkActive(item) }"
          @click="navigateToNetwork(item)"
        >
          <span class="network-icon-wrap" :style="{ background: networkColors[item.id] }">
            <i :class="item.icon" />
          </span>
          <span class="network-name">{{ item.label }}</span>
          <i class="pi pi-chevron-right network-arrow" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import type { MenuItem } from '../types'
import NetworkWebviewHost from './NetworkWebviewHost.vue'

const router = useRouter()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()

const profileMenuVisible = ref(false)

const menuItems = ref<MenuItem[]>([
  { id: 1, label: 'Twitter / X', icon: 'pi pi-twitter', route: '/twitter' },
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

const networkColors: Record<number, string> = {
  1:  '#000000',
  2:  '#1877F2',
  3:  'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  4:  '#0A66C2',
  5:  '#010101',
  6:  '#000000',
  7:  '#5865F2',
  8:  '#FF4500',
  9:  '#EA4335',
  10: '#6366F1',
}

const isNetworkActive = (item: MenuItem) =>
  webviewStore.activeNetworkId === item.route.slice(1)

const navigateToNetwork = (network: MenuItem) => {
  profileMenuVisible.value = false
  const networkId = network.route.slice(1)
  if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }
}

function selectProfile(profileId: string) {
  profilesStore.setActive(profileId)
  profileMenuVisible.value = false
}

function addProfile() {
  const name = `Profil ${profilesStore.profiles.length + 1}`
  profilesStore.add(name)
  profileMenuVisible.value = false
}
</script>

<style scoped>
/* ─── Webview screen ─────────────────────────────────────────── */

.mobile-webview-screen {
  height: 100vh;
  width: 100%;
}

.mobile-webview-host {
  width: 100%;
  height: 100%;
}

/* ─── Home screen ────────────────────────────────────────────── */

.mobile-home {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  /* Background fills to the very top (behind status bar icons), content is padded below */
  background: var(--surface-ground);
  padding-top: env(safe-area-inset-top, 24px);
}


/* ─── Profile card ───────────────────────────────────────────── */

.profile-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin: 1rem;
  padding: 1rem 1.1rem;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px solid var(--surface-border);
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: background-color 0.15s;
}

.profile-card:active {
  background: var(--surface-hover);
}

.profile-avatar {
  font-size: 2.2rem;
  line-height: 1;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  border-radius: 50%;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
}

.profile-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-sub {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.profile-chevron {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.profile-chevron.rotated {
  transform: rotate(180deg);
}

/* ─── Profile dropdown ───────────────────────────────────────── */

.profile-dropdown {
  margin: 0 1rem 0.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.profile-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.12s;
  border-bottom: 1px solid var(--surface-border);
}

.profile-option:last-of-type {
  border-bottom: none;
}

.profile-option:active,
.profile-option:hover {
  background: var(--surface-hover);
}

.profile-option.active {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.profile-option-emoji {
  font-size: 1.2rem;
}

.profile-option-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.profile-option .pi-check {
  font-size: 0.8rem;
  color: var(--primary-color);
}

.add-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-top: 1px solid var(--surface-border);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  transition: background-color 0.12s, color 0.12s;
}

.add-profile-btn:hover,
.add-profile-btn:active {
  background: var(--surface-hover);
  color: var(--text-color);
}

/* ─── Network list ───────────────────────────────────────────── */

.networks-section {
  flex: 1;
  padding: 0 1rem 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}

.section-title {
  margin: 0.5rem 0 0.6rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.network-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.network-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s, transform 0.1s;
  box-shadow: var(--card-shadow);
}

.network-card:active {
  transform: scale(0.98);
  background: var(--surface-hover);
}

.network-card.active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 6%, var(--surface-card));
}

.network-icon-wrap {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.network-icon-wrap i {
  font-size: 1.15rem;
  color: #fff;
}

.network-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.network-arrow {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .network-card,
  .profile-chevron {
    transition: none;
  }
}
</style>
