<template>
  <!-- Webview active: transparent host — the native Kotlin overlay covers everything -->
  <div v-if="webviewStore.activeUrl" class="mobile-webview-screen">
    <NetworkWebviewHost class="mobile-webview-host" />
  </div>

  <!-- Home screen -->
  <div v-else class="mobile-home" @click.self="exitEditMode">

    <!-- Profile card (sticky top) -->
    <div class="profile-card" @click="networkEditMode ? exitEditMode() : (profileSheetVisible = true)">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">
          <img v-if="profilesStore.activeProfile?.avatar" :src="profilesStore.activeProfile.avatar" class="profile-avatar-img" />
          <span v-else>{{ profilesStore.activeProfile?.emoji ?? '👤' }}</span>
        </div>
        <div class="profile-avatar-ring" />
      </div>
      <div class="profile-info">
        <span class="profile-name">{{ profilesStore.activeProfile?.name ?? $t('profile.default_name') }}</span>
        <span class="profile-sub">
          <i class="pi pi-th-large" style="font-size:0.65rem; margin-right:0.3rem;" />
          {{ visibleMenuItems.length }} {{ $t('profile.networks_count', { count: visibleMenuItems.length }) }} · {{ $t('profile.tap_to_manage') }}
        </span>
        <div class="profile-pills">
          <span v-for="item in visibleMenuItems.slice(0, 5)" :key="item.id" class="profile-pill" :style="{ background: pillColor(item.id) }" />
        </div>
      </div>
      <i class="pi pi-chevron-down profile-chevron" />
    </div>

    <!-- Quick actions bar (sticky top) -->
    <div class="quick-actions">
      <!-- Notifications -->
      <button class="quick-action-btn" @click="notificationsVisible = !notificationsVisible">
        <span class="quick-action-icon">
          <i class="pi pi-bell" />
          <span v-if="notificationCount > 0" class="notif-badge">{{ notificationCount }}</span>
        </span>
        <span class="quick-action-label">{{ $t('common.notifications') }}</span>
        <i class="pi pi-chevron-right quick-action-arrow" />
      </button>

      <!-- Friends filter toggle -->
      <div class="friends-filter-row">
        <span class="friends-filter-label">
          <i class="pi pi-users" />
          {{ $t('friends_filter.friends_only') }}
        </span>
        <button
          class="friends-toggle-pill"
          :class="{ enabled: friendsFilterEnabled }"
          @click="toggleFriendsFilter"
        >
          <span class="toggle-thumb" />
        </button>
      </div>
    </div>

    <!-- Notifications panel -->
    <div v-if="notificationsVisible" class="notif-panel">
      <div class="notif-header">
        <span class="notif-title">{{ $t('common.notifications') }}</span>
        <button class="notif-clear" @click="notificationCount = 0">{{ $t('notif.mark_all_read') }}</button>
      </div>
      <div class="notif-empty">
        <i class="pi pi-bell-slash" />
        <span>{{ $t('notif.empty_state') }}</span>
      </div>
    </div>

    <!-- Scrollable network grid -->
    <div class="mobile-home-scroll">

    <!-- Network grid -->
    <div class="networks-section" @click.self="exitEditMode">
      <p class="section-title">{{ $t('sidebar.networks_section') }}</p>
      <div class="network-grid">
        <button
          v-for="item in visibleMenuItems"
          :key="item.id"
          class="network-tile"
          :class="{ active: isNetworkActive(item), 'edit-mode': networkEditMode }"
          :style="{ background: tileBg(item.id) }"
          @click="networkEditMode ? handleEditClick(item) : navigateToNetwork(item)"
          @touchstart="startLongPress(item)"
          @touchend="cancelLongPress"
          @touchmove="cancelLongPress"
          @contextmenu.prevent
        >
          <span class="network-icon-wrap" :style="{ background: networkColors[item.id] ?? 'var(--surface-hover)' }">
            <ThreadsIcon v-if="item.route === '/threads'" size="1.35rem" color="#fff" />
            <SnapchatIcon v-else-if="item.route === '/snapchat'" size="1.35rem" color="#fff" />
            <NextdoorIcon v-else-if="item.route === '/nextdoor'" size="1.35rem" color="#fff" />
            <MessengerIcon v-else-if="item.route === '/messenger'" size="1.35rem" color="#fff" />
            <QuoraIcon v-else-if="item.route === '/quora'" size="1.35rem" color="#fff" />
            <i v-else :class="item.icon" />
          </span>
          <span class="network-name">{{ item.label }}</span>
          <span v-if="networkEditMode && !item.route.startsWith('/custom-')" class="network-toggle" :class="{ hidden: isNetworkHiddenForProfile(item) }">
            <span class="network-toggle-thumb" />
          </span>
          <span v-if="networkEditMode && item.route.startsWith('/custom-')" class="custom-delete-badge">
            <i class="pi pi-times" />
          </span>
        </button>

        <!-- Add custom link tile (only in edit mode) -->
        <button
          v-if="networkEditMode"
          class="network-tile add-custom-tile edit-mode"
          @click="showAddLinkForm = true"
        >
          <span class="network-icon-wrap" style="background: var(--surface-hover)">
            <i class="pi pi-plus" />
          </span>
          <span class="network-name">{{ $t('common.add') }}</span>
        </button>
      </div>
      <p v-if="networkEditMode" class="edit-hint">{{ $t('networks.edit_mode_hint') }}</p>

      <!-- Add custom link form -->
      <div v-if="showAddLinkForm" class="add-link-sheet" @click.self="showAddLinkForm = false">
        <div class="add-link-card">
          <p class="add-link-title">{{ $t('links.add_dialog_title') }}</p>
          <input v-model="newLinkLabel" class="add-link-input" placeholder="Nom (ex: Mon site)" />
          <input v-model="newLinkUrl" class="add-link-input" placeholder="URL (ex: example.com)" @keydown.enter="submitCustomLink" />
          <div class="add-link-actions">
            <button class="add-link-cancel" @click="showAddLinkForm = false">{{ $t('common.cancel') }}</button>
            <button class="add-link-confirm" :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()" @click="submitCustomLink">{{ $t('common.add') }}</button>
          </div>
        </div>
      </div>
    </div>

    </div><!-- /.mobile-home-scroll -->

    <!-- Settings button (sticky bottom) -->
    <button class="settings-btn" @click="settingsVisible = true">
      <i class="pi pi-cog" />
      <span>{{ $t('common.settings') }}</span>
      <i class="pi pi-chevron-right quick-action-arrow" />
    </button>
  </div>

  <!-- ─── Profile bottom sheet ─── -->
  <MobileProfileSheet v-model="profileSheetVisible" />

  <!-- ─── Signup nudge (once/day, max 5, then 30-day pause) ─── -->
  <SignupNudge
    v-model="nudgeVisible"
    @dismiss="nudge.dismiss()"
    @account-created="nudge.onAccountCreated()"
  />

  <!-- ─── Settings bottom sheet ─── -->
  <MobileSettingsSheet v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useCustomLinksStore } from '@/stores/customLinks'
import type { MenuItem } from '../types'
import NetworkWebviewHost from './NetworkWebviewHost.vue'
import MobileProfileSheet from './MobileProfileSheet.vue'
import MobileSettingsSheet from './MobileSettingsSheet.vue'
import SignupNudge from './SignupNudge.vue'
import { useSignupNudge } from '@/composables/useSignupNudge'
import ThreadsIcon from './icons/ThreadsIcon.vue'
import SnapchatIcon from './icons/SnapchatIcon.vue'
import NextdoorIcon from './icons/NextdoorIcon.vue'
import MessengerIcon from './icons/MessengerIcon.vue'
import QuoraIcon from './icons/QuoraIcon.vue'

const router = useRouter()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const filterStore = useFriendsFilterStore()
const customLinksStore = useCustomLinksStore()

// ─── Sheet state ──────────────────────────────────────────────
const profileSheetVisible = ref(false)
const settingsVisible = ref(false)

// ─── Signup nudge ────────────────────────────────────────────
const nudge = useSignupNudge()
const nudgeVisible = ref(false)

// Listen for native popup menu "Changer de profil" event
const openProfileSheetFromNative = () => { profileSheetVisible.value = true }
onMounted(async () => {
  window.addEventListener('sfz-show-profile-sheet', openProfileSheetFromNative)

  nudge.recordFirstLaunch()
  await nudge.check()
  if (nudge.showNudge.value) {
    nudgeVisible.value = true
  }
})
onUnmounted(() => {
  window.removeEventListener('sfz-show-profile-sheet', openProfileSheetFromNative)
})

// ─── Notifications ────────────────────────────────────────────
const notificationsVisible = ref(false)
const notificationCount = ref(3)

// ─── Network edit mode (long press to show/hide networks) ────
const networkEditMode = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function startLongPress(_item: MenuItem) {
  cancelLongPress()
  longPressTimer = setTimeout(() => {
    networkEditMode.value = true
    longPressTimer = null
  }, 500)
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function exitEditMode() {
  networkEditMode.value = false
}

const networkIdFromItem = (item: MenuItem) => item.route.slice(1)

function toggleNetworkVisibility(item: MenuItem) {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  profilesStore.toggleNetworkHidden(profileId, networkIdFromItem(item))
}

function isNetworkHiddenForProfile(item: MenuItem): boolean {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return false
  return profilesStore.isNetworkHidden(profileId, networkIdFromItem(item))
}

/** Built-in menu items + custom links from the active profile, merged. */
const allMenuItems = computed(() => {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return menuItems.value
  const customs = customLinksStore.getLinks(profileId)
  const customItems: MenuItem[] = customs.map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
  return [...menuItems.value, ...customItems]
})

const visibleMenuItems = computed(() => {
  if (networkEditMode.value) return allMenuItems.value
  const profileId = profilesStore.activeProfileId
  if (!profileId) return allMenuItems.value
  return allMenuItems.value.filter(item => !profilesStore.isNetworkHidden(profileId, networkIdFromItem(item)))
})

// ─── Custom links ────────────────────────────────────────────
const showAddLinkForm = ref(false)
const newLinkLabel = ref('')
const newLinkUrl = ref('')

function submitCustomLink() {
  const profileId = profilesStore.activeProfileId
  if (!profileId || !newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  customLinksStore.addLink(profileId, newLinkLabel.value, newLinkUrl.value)
  newLinkLabel.value = ''
  newLinkUrl.value = ''
  showAddLinkForm.value = false
}

function handleEditClick(item: MenuItem) {
  const nId = networkIdFromItem(item)
  if (nId.startsWith('custom-')) {
    // Delete custom link
    const profileId = profilesStore.activeProfileId
    if (profileId) customLinksStore.removeLink(profileId, nId)
  } else {
    toggleNetworkVisibility(item)
  }
}

// ─── Friends filter ───────────────────────────────────────────
const friendsFilterEnabled = computed(() => filterStore.enabled)
const toggleFriendsFilter = () => filterStore.toggle()

// ─── Network list ─────────────────────────────────────────────
const menuItems = ref<MenuItem[]>([
  { id: 1, label: 'Twitter / X', icon: 'pi pi-twitter', route: '/twitter' },
  { id: 2, label: 'Facebook', icon: 'pi pi-facebook', route: '/facebook' },
  { id: 3, label: 'Instagram', icon: 'pi pi-instagram', route: '/instagram' },
  { id: 4, label: 'LinkedIn', icon: 'pi pi-linkedin', route: '/linkedin' },
  { id: 5, label: 'TikTok', icon: 'pi pi-tiktok', route: '/tiktok' },
  { id: 6, label: 'Threads', icon: 'pi pi-at', route: '/threads' },
  { id: 7, label: 'Discord', icon: 'pi pi-discord', route: '/discord' },
  { id: 8, label: 'Reddit', icon: 'pi pi-reddit', route: '/reddit' },
  { id: 9, label: 'Messenger', icon: 'pi pi-comments', route: '/messenger' },
  { id: 10, label: 'Snapchat', icon: 'pi pi-camera', route: '/snapchat' },
  { id: 11, label: 'Quora', icon: 'pi pi-question-circle', route: '/quora' },
  { id: 12, label: 'Pinterest', icon: 'pi pi-pinterest', route: '/pinterest' },
  // { id: 13, label: 'WhatsApp', icon: 'pi pi-whatsapp', route: '/whatsapp' }, // disabled 2026-04-12 — see docs/whatsapp-web-integration.md
  { id: 14, label: 'Telegram', icon: 'pi pi-telegram', route: '/telegram' },
  { id: 15, label: 'Nextdoor', icon: 'pi pi-map-marker', route: '/nextdoor' },
  { id: 16, label: 'Kanban', icon: 'pi pi-th-large', route: '/kanban' },
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
  9:  '#0084FF',
  10: '#FFFC00',
  11: '#B92B27',
  12: '#E60023',
  13: '#25D366',
  14: '#0088cc',
  15: '#8ED500',
  16: '#6366F1',
}

const isNetworkActive = (item: MenuItem) =>
  webviewStore.activeNetworkId === item.route.slice(1)

const pillColor = (id: number) => {
  const c = networkColors[id]
  return c.startsWith('linear') ? '#e6683c' : c
}

const tileBg = (id: number) => {
  const c = networkColors[id]
  if (!c) return undefined
  const solid = c.startsWith('linear') ? '#e6683c' : c
  return `color-mix(in srgb, ${solid} 7%, var(--surface-card))`
}

// ─── Navigation ───────────────────────────────────────────────
const navigateToNetwork = (network: MenuItem) => {
  const networkId = network.route.slice(1)
  if (networkId.startsWith('custom-')) {
    const profileId = profilesStore.activeProfileId
    if (!profileId) return
    const link = customLinksStore.getLinks(profileId).find(l => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(networkId, link.url)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }
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
  overflow: hidden;
  background: var(--surface-ground);
  padding-top: env(safe-area-inset-top, 24px);
}

.mobile-home-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ─── Profile card ───────────────────────────────────────────── */

.profile-card {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 1rem;
  margin: 1rem;
  padding: 1rem 1.1rem;
  background: var(--surface-card);
  border-radius: 18px;
  border: 1px solid var(--surface-border);
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: background-color 0.15s;
}

.profile-card:active {
  background: var(--surface-hover);
}

.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  font-size: 2.2rem;
  line-height: 1;
  width: 3.4rem;
  height: 3.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  border-radius: 50%;
  overflow: hidden;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2.5px solid var(--primary-color);
  opacity: 0.6;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.profile-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-sub {
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
}

.profile-pills {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.profile-pill {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  opacity: 0.85;
}

.profile-chevron {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  flex-shrink: 0;
}

/* ─── Quick actions ──────────────────────────────────────────── */

.quick-actions {
  flex-shrink: 0;
  margin: 0 1rem 0.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--surface-border);
  cursor: pointer;
  transition: background-color 0.12s;
}

.quick-action-btn:active {
  background: var(--surface-hover);
}

.quick-action-icon {
  position: relative;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  border-radius: 8px;
  flex-shrink: 0;
}

.quick-action-icon i {
  font-size: 1rem;
  color: var(--text-color);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 1rem;
  height: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.2rem;
}

.quick-action-label {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  text-align: left;
}

.quick-action-arrow {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

.friends-filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
}

.friends-filter-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.friends-filter-label i {
  font-size: 1rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  border-radius: 8px;
}

.friends-toggle-pill {
  position: relative;
  width: 2.8rem;
  height: 1.6rem;
  border-radius: 1rem;
  border: none;
  background: var(--surface-border);
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.friends-toggle-pill.enabled {
  background: var(--primary-color);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.friends-toggle-pill.enabled .toggle-thumb {
  transform: translateX(1.2rem);
}

/* ─── Notifications panel ────────────────────────────────────── */

.notif-panel {
  flex-shrink: 0;
  margin: 0 1rem 0.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.notif-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notif-clear {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.notif-empty i {
  font-size: 1.5rem;
  opacity: 0.4;
}

/* ─── Network grid ───────────────────────────────────────────── */

.networks-section {
  flex: 1;
  padding: 0 0.75rem 0.5rem;
}

.section-title {
  margin: 0.25rem 0 0.5rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.network-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.network-tile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.75rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.1s;
  box-shadow: var(--card-shadow);
}

.network-tile:active {
  transform: scale(0.96);
  background: var(--surface-hover);
}

.network-tile.active {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 6%, var(--surface-card));
}

.network-icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.network-icon-wrap i {
  font-size: 1.35rem;
  color: #fff;
}

.network-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: left;
  line-height: 1.2;
  flex: 1;
}

/* ─── Network edit mode (long press) ────────────────────────── */

.network-tile.edit-mode {
  animation: tile-wiggle 0.3s ease;
}

.network-toggle {
  width: 2.2rem;
  height: 1.3rem;
  border-radius: 0.75rem;
  background: var(--primary-color);
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.network-toggle.hidden {
  background: var(--surface-border);
}

.network-toggle-thumb {
  position: absolute;
  top: 2.5px;
  right: 3px;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.network-toggle.hidden .network-toggle-thumb {
  transform: translateX(-0.85rem);
}

.edit-hint {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  margin: 0.5rem 0 0;
  font-style: italic;
}

.custom-delete-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
}

.add-custom-tile {
  border: 2px dashed var(--surface-border);
  background: transparent;
}

.add-link-sheet {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.add-link-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1.25rem;
  width: 100%;
  max-width: 20rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.add-link-title {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
}

.add-link-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  background: var(--surface-ground);
  color: var(--text-color);
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.add-link-input:focus {
  border-color: var(--primary-color);
}

.add-link-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.add-link-cancel,
.add-link-confirm {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.add-link-cancel {
  background: var(--surface-hover);
  color: var(--text-color);
}

.add-link-confirm {
  background: var(--primary-color);
  color: #fff;
}

.add-link-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes tile-wiggle {
  0% { transform: scale(1); }
  50% { transform: scale(0.97); }
  100% { transform: scale(1); }
}

/* ─── Settings button ────────────────────────────────────────── */

.settings-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  margin: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  padding: 0.85rem 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  transition: background-color 0.12s;
}

.settings-btn:active {
  background: var(--surface-hover);
}

.settings-btn > i:first-child {
  font-size: 1rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  border-radius: 8px;
}

.settings-btn > span {
  flex: 1;
  text-align: left;
}

@media (prefers-reduced-motion: reduce) {
  .network-tile,
  .friends-toggle-pill,
  .toggle-thumb {
    transition: none;
  }
}
</style>
