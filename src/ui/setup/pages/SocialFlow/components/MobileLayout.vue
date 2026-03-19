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
            <GoogleMessagesIcon v-else-if="item.route === '/googlemessages'" size="1.35rem" color="#fff" />
            <PatreonIcon v-else-if="item.route === '/patreon'" size="1.35rem" color="#fff" />
            <CircleIcon v-else-if="item.route === '/circle'" size="1.35rem" color="#fff" />
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

  <!-- ─── Profile bottom sheet (Teleport avoids overflow clipping) ─── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="profileSheetVisible" class="sheet-overlay" @click.self="closeSheet">
        <div class="profile-sheet">
          <!-- Handle -->
          <div class="sheet-handle" />

          <!-- Header -->
          <div class="sheet-header">
            <span class="sheet-title">{{ $t('profiles.title') }}</span>
            <button class="sheet-close-btn" @click="closeSheet">
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Profile list -->
          <div class="sheet-profiles">
            <div
              v-for="profile in profilesStore.profiles"
              :key="profile.id"
              class="sheet-profile-row"
              :class="{ 'sheet-profile-row--active': profile.id === profilesStore.activeProfileId }"
            >
              <!-- Avatar (tap to select profile) -->
              <div class="sheet-avatar" @click="selectProfile(profile.id)">
                <img v-if="profile.avatar" :src="profile.avatar" class="sheet-avatar-img" />
                <span v-else class="sheet-avatar-emoji">{{ profile.emoji }}</span>
                <i v-if="profile.id === profilesStore.activeProfileId" class="pi pi-check sheet-avatar-check" />
              </div>

              <!-- Name / inline edit -->
              <div class="sheet-profile-info" @click="selectProfile(profile.id)">
                <input
                  v-if="editingId === profile.id"
                  :ref="el => { if (el) editInputRef = el as HTMLInputElement }"
                  v-model="editName"
                  class="name-edit-input"
                  @blur="saveEdit(profile.id)"
                  @keydown.enter="saveEdit(profile.id)"
                  @keydown.escape="cancelEdit"
                  @click.stop
                />
                <span v-else class="sheet-profile-name">{{ profile.name }}</span>
                <span v-if="profile.id === profilesStore.activeProfileId" class="active-label">{{ $t('profile.active_label') }}</span>
              </div>

              <!-- Actions -->
              <div class="sheet-profile-actions">
                <button class="sheet-action" :title="$t('profile.rename_action')" @click.stop="startEdit(profile)">
                  <i class="pi pi-pencil" />
                </button>
                <button class="sheet-action" :title="$t('profile.avatar_action')" @click.stop="pickAvatar(profile.id)">
                  <i class="pi pi-camera" />
                </button>
                <button class="sheet-action" :title="$t('profile.clear_cookies_action')" @click.stop="clearCookiesProfileId = clearCookiesProfileId === profile.id ? null : profile.id">
                  <i class="pi pi-eraser" />
                </button>
                <button
                  v-if="profilesStore.profiles.length > 1"
                  class="sheet-action sheet-action--danger"
                  :title="$t('common.delete')"
                  @click.stop="deleteProfile(profile.id)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </div>
          </div>

          <!-- Clear cookies per network (expandable per profile) -->
          <div v-if="clearCookiesProfileId" class="clear-cookies-section">
            <div class="clear-cookies-header">
              <i class="pi pi-trash" />
              <span>{{ $t('profile.clear_cookies_header', { name: profilesStore.profiles.find(p => p.id === clearCookiesProfileId)?.name }) }}</span>
              <button class="sheet-close-btn" @click="clearCookiesProfileId = null" style="margin-left:auto;">
                <i class="pi pi-times" />
              </button>
            </div>
            <div class="clear-cookies-list">
              <button
                v-for="nw in webviewNetworks"
                :key="nw.id"
                class="clear-cookie-row"
                @click="clearNetworkCookies(nw.id)"
              >
                <ThreadsIcon v-if="nw.id === 'threads'" size="0.9rem" class="clear-cookie-icon" />
                <SnapchatIcon v-else-if="nw.id === 'snapchat'" size="0.9rem" class="clear-cookie-icon" />
                <NextdoorIcon v-else-if="nw.id === 'nextdoor'" size="0.9rem" class="clear-cookie-icon" />
                <MessengerIcon v-else-if="nw.id === 'messenger'" size="0.9rem" class="clear-cookie-icon" />
                <QuoraIcon v-else-if="nw.id === 'quora'" size="0.9rem" class="clear-cookie-icon" />
                <GoogleMessagesIcon v-else-if="nw.id === 'googlemessages'" size="0.9rem" class="clear-cookie-icon" />
                <PatreonIcon v-else-if="nw.id === 'patreon'" size="0.9rem" class="clear-cookie-icon" />
                <CircleIcon v-else-if="nw.id === 'circle'" size="0.9rem" class="clear-cookie-icon" />
                <i v-else :class="nw.icon" class="clear-cookie-icon" />
                <span class="clear-cookie-label">{{ nw.label }}</span>
                <span v-if="clearedNetworks.has(`${clearCookiesProfileId}:${nw.id}`)" class="clear-cookie-done">
                  <i class="pi pi-check" />
                </span>
                <i v-else class="pi pi-eraser clear-cookie-action" />
              </button>
            </div>
          </div>

          <!-- Add new profile -->
          <div class="sheet-footer">
            <div v-if="addingNew" class="add-profile-form">
              <input
                :ref="el => { if (el) addInputRef = el as HTMLInputElement }"
                v-model="newProfileName"
                class="name-edit-input"
                placeholder="Nom du profil…"
                @keydown.enter="confirmAdd"
                @keydown.escape="cancelAdd"
              />
              <button class="add-confirm-btn" @click="confirmAdd"><i class="pi pi-check" /></button>
              <button class="add-cancel-btn" @click="cancelAdd"><i class="pi pi-times" /></button>
            </div>
            <button v-else class="add-profile-btn" @click="startAdd">
              <i class="pi pi-plus" />
              <span>{{ $t('profile.add_new_button') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ─── Settings bottom sheet ─── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="settingsVisible" class="sheet-overlay" @click.self="settingsVisible = false">
        <div class="profile-sheet settings-sheet">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <span class="sheet-title">{{ $t('common.settings') }}</span>
            <button class="sheet-close-btn" @click="settingsVisible = false">
              <i class="pi pi-times" />
            </button>
          </div>

          <div class="settings-content">
            <!-- User info section -->
            <p class="settings-section-label">Compte</p>

            <div class="settings-field">
              <label class="settings-label" for="settings-username">
                <i class="pi pi-user" />
                {{ $t('settings.username_label') }}
              </label>
              <input
                id="settings-username"
                v-model="settingsUsername"
                class="settings-input"
                placeholder="Votre nom…"
                @blur="saveSettings"
              />
            </div>

            <div class="settings-field">
              <label class="settings-label" for="settings-email">
                <i class="pi pi-envelope" />
                {{ $t('settings.email_label') }}
              </label>
              <input
                id="settings-email"
                v-model="settingsEmail"
                type="email"
                class="settings-input"
                placeholder="votre@email.com"
                @blur="saveSettings"
              />
            </div>

            <!-- Preferences section -->
            <p class="settings-section-label">{{ $t('settings.preferences') }}</p>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-moon" />
                {{ $t('theme.dark_mode') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: themeStore.isDarkMode }"
                @click="themeStore.toggleTheme()"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-palette" />
                {{ $t('theme.focus_mode') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: themeStore.grayscaleEnabled }"
                @click="themeStore.setGrayscale(!themeStore.grayscaleEnabled)"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <!-- Backup / Restore -->
            <p class="settings-section-label">{{ $t('backup.section_title') }}</p>
            <BackupRestore />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Hidden file input for avatar upload -->
  <input
    ref="avatarFileInput"
    type="file"
    accept="image/*"
    style="display: none"
    @change="handleAvatarChange"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useWebviewStore, WEBVIEW_URLS } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useThemeStore } from '@/stores/theme'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useCustomLinksStore } from '@/stores/customLinks'
import type { Profile } from '@/stores/profiles'
import type { MenuItem } from '../types'
import NetworkWebviewHost from './NetworkWebviewHost.vue'
import BackupRestore from './BackupRestore.vue'
import ThreadsIcon from './icons/ThreadsIcon.vue'
import SnapchatIcon from './icons/SnapchatIcon.vue'
import NextdoorIcon from './icons/NextdoorIcon.vue'
import MessengerIcon from './icons/MessengerIcon.vue'
import QuoraIcon from './icons/QuoraIcon.vue'
import GoogleMessagesIcon from './icons/GoogleMessagesIcon.vue'
import PatreonIcon from './icons/PatreonIcon.vue'
import CircleIcon from './icons/CircleIcon.vue'

const { t } = useI18n()
const router = useRouter()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const themeStore = useThemeStore()
const filterStore = useFriendsFilterStore()
const customLinksStore = useCustomLinksStore()

// ─── Sheet state ──────────────────────────────────────────────
const profileSheetVisible = ref(false)
const settingsVisible = ref(false)

// Listen for native popup menu "Changer de profil" event
const openProfileSheetFromNative = () => { profileSheetVisible.value = true }
onMounted(() => {
  window.addEventListener('sfz-show-profile-sheet', openProfileSheetFromNative)
})
onUnmounted(() => {
  window.removeEventListener('sfz-show-profile-sheet', openProfileSheetFromNative)
})

// ─── Settings state ──────────────────────────────────────────
const settingsUsername = ref(localStorage.getItem('sfz_username') ?? '')
const settingsEmail = ref(localStorage.getItem('sfz_email') ?? '')

function saveSettings() {
  localStorage.setItem('sfz_username', settingsUsername.value.trim())
  localStorage.setItem('sfz_email', settingsEmail.value.trim())
}

// ─── Rename state ─────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// ─── Add profile state ────────────────────────────────────────
const addingNew = ref(false)
const newProfileName = ref('')
const addInputRef = ref<HTMLInputElement | null>(null)

// ─── Avatar state ─────────────────────────────────────────────
const avatarFileInput = ref<HTMLInputElement | null>(null)
const pendingAvatarProfileId = ref<string | null>(null)

// ─── Clear cookies per network ────────────────────────────────
const clearCookiesProfileId = ref<string | null>(null)
const clearedNetworks = ref<Set<string>>(new Set())

const webviewNetworks = computed(() => {
  const iconMap: Record<string, string> = {
    twitter: 'pi pi-twitter', facebook: 'pi pi-facebook', instagram: 'pi pi-instagram',
    linkedin: 'pi pi-linkedin', tiktok: 'pi pi-tiktok', threads: 'pi pi-at',
    discord: 'pi pi-discord', reddit: 'pi pi-reddit', messenger: 'pi pi-comments',
    snapchat: 'pi pi-camera', quora: 'pi pi-question-circle', pinterest: 'pi pi-pinterest',
    whatsapp: 'pi pi-whatsapp', telegram: 'pi pi-telegram', nextdoor: 'pi pi-map-marker',
    googlemessages: 'pi pi-android', patreon: 'pi pi-heart', circle: 'pi pi-circle',
  }
  const labelMap: Record<string, string> = {
    twitter: 'Twitter / X', facebook: 'Facebook', instagram: 'Instagram',
    linkedin: 'LinkedIn', tiktok: 'TikTok', threads: 'Threads',
    discord: 'Discord', reddit: 'Reddit', messenger: 'Messenger',
    snapchat: 'Snapchat', quora: 'Quora', pinterest: 'Pinterest',
    whatsapp: 'WhatsApp', telegram: 'Telegram', nextdoor: 'Nextdoor',
    googlemessages: 'Google Messages', patreon: 'Patreon', circle: 'Circle',
  }
  return Object.keys(WEBVIEW_URLS).map(id => ({
    id,
    icon: iconMap[id] ?? 'pi pi-globe',
    label: labelMap[id] ?? id,
  }))
})

async function clearNetworkCookies(networkId: string) {
  const profileId = clearCookiesProfileId.value
  if (!profileId) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    // Close webview if it's currently open for this profile+network
    await invoke('close_webview', { profileId, networkId }).catch(() => {})
    // Wipe session data (cookies, localStorage, IndexedDB)
    await invoke('delete_network_session', { profileId, networkId })
    clearedNetworks.value.add(`${profileId}:${networkId}`)
  } catch (e) {
    console.error('Failed to clear cookies:', e)
  }
}

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
  { id: 13, label: 'WhatsApp', icon: 'pi pi-whatsapp', route: '/whatsapp' },
  { id: 14, label: 'Telegram', icon: 'pi pi-telegram', route: '/telegram' },
  { id: 15, label: 'Nextdoor', icon: 'pi pi-map-marker', route: '/nextdoor' },
  { id: 16, label: 'Patreon', icon: 'pi pi-heart', route: '/patreon' },
  { id: 17, label: 'Circle', icon: 'pi pi-circle', route: '/circle' },
  { id: 18, label: 'Kanban', icon: 'pi pi-th-large', route: '/kanban' },
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
  16: '#FF424D',
  17: '#6D28D9',
  18: '#6366F1',
}

const isNetworkActive = (item: MenuItem) =>
  webviewStore.activeNetworkId === item.route.slice(1)

const pillColor = (id: number) => {
  const c = networkColors[id]
  return c.startsWith('linear') ? '#e6683c' : c
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

// ─── Sheet actions ────────────────────────────────────────────
function closeSheet() {
  profileSheetVisible.value = false
  clearCookiesProfileId.value = null
  clearedNetworks.value.clear()
  cancelEdit()
  cancelAdd()
}

function selectProfile(profileId: string) {
  profilesStore.setActive(profileId)
  closeSheet()
}

function deleteProfile(profileId: string) {
  profilesStore.remove(profileId)
}

// ─── Rename ───────────────────────────────────────────────────
function startEdit(profile: Profile) {
  editingId.value = profile.id
  editName.value = profile.name
  nextTick(() => editInputRef.value?.focus())
}

function saveEdit(profileId: string) {
  const trimmed = editName.value.trim()
  if (trimmed) profilesStore.rename(profileId, trimmed)
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

// ─── Add profile ──────────────────────────────────────────────
function startAdd() {
  addingNew.value = true
  newProfileName.value = ''
  nextTick(() => addInputRef.value?.focus())
}

function confirmAdd() {
  const trimmed = newProfileName.value.trim()
  if (trimmed) profilesStore.add(trimmed)
  addingNew.value = false
}

function cancelAdd() {
  addingNew.value = false
}

// ─── Avatar upload ────────────────────────────────────────────
function pickAvatar(profileId: string) {
  pendingAvatarProfileId.value = profileId
  avatarFileInput.value?.click()
}

function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pendingAvatarProfileId.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (dataUrl && pendingAvatarProfileId.value) {
      profilesStore.setAvatar(pendingAvatarProfileId.value, dataUrl)
    }
    pendingAvatarProfileId.value = null
  }
  reader.readAsDataURL(file)

  // Reset so same file can be picked again
  ;(event.target as HTMLInputElement).value = ''
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

/* ─── Settings sheet ─────────────────────────────────────────── */

.settings-content {
  padding: 0 1.25rem 1.5rem;
  overflow-y: auto;
}

.settings-section-label {
  margin: 1rem 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.settings-field {
  margin-bottom: 0.75rem;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-bottom: 0.35rem;
}

.settings-label i {
  font-size: 0.85rem;
}

.settings-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  color: var(--text-color);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.settings-input:focus {
  border-color: var(--primary-color);
}

.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.settings-toggle-row:last-child {
  border-bottom: none;
}

.settings-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.settings-toggle-label i {
  font-size: 1rem;
  width: 2rem;
  text-align: center;
}

/* ─── Profile bottom sheet ───────────────────────────────────── */

.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.profile-sheet {
  width: 100%;
  background: var(--surface-card);
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet-handle {
  width: 2.5rem;
  height: 4px;
  background: var(--surface-border);
  border-radius: 2px;
  margin: 0.75rem auto 0;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem 0.5rem;
  flex-shrink: 0;
}

.sheet-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.sheet-close-btn {
  background: var(--surface-ground);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  transition: background-color 0.12s;
}

.sheet-close-btn:active {
  background: var(--surface-hover);
}

/* Profile list */
.sheet-profiles {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.75rem;
}

.sheet-profile-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem;
  border-radius: 12px;
  transition: background-color 0.12s;
  margin-bottom: 0.25rem;
}

.sheet-profile-row:active {
  background: var(--surface-hover);
}

.sheet-profile-row--active {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.sheet-avatar {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  font-size: 1.4rem;
}

.sheet-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sheet-avatar-emoji {
  font-size: 1.4rem;
  line-height: 1;
}

.sheet-avatar-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 75%, transparent);
  color: #fff;
  font-size: 0.9rem;
  border-radius: 50%;
}

.sheet-profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  cursor: pointer;
  overflow: hidden;
}

.sheet-profile-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-label {
  font-size: 0.7rem;
  color: var(--primary-color);
  font-weight: 600;
}

.name-edit-input {
  flex: 1;
  font-size: 0.9rem;
  background: var(--surface-ground);
  border: 1.5px solid var(--primary-color);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  color: var(--text-color);
  outline: none;
  width: 100%;
}

/* Action buttons */
.sheet-profile-actions {
  display: flex;
  gap: 0.15rem;
  flex-shrink: 0;
}

.sheet-action {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 0.4rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  transition: color 0.12s, background-color 0.12s;
}

.sheet-action:active {
  background: var(--surface-hover);
  color: var(--text-color);
}

.sheet-action--danger:active {
  color: #ef4444;
}

/* Clear cookies section */
.clear-cookies-section {
  border-top: 1px solid var(--surface-border);
  padding: 0.5rem 0.75rem;
}

.clear-cookies-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
  padding: 0.25rem 0.25rem 0.5rem;
}

.clear-cookies-header i:first-child {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.clear-cookies-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.clear-cookie-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.12s;
}

.clear-cookie-row:active {
  background: var(--surface-hover);
}

.clear-cookie-icon {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.clear-cookie-label {
  flex: 1;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-color);
  text-align: left;
}

.clear-cookie-action {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.clear-cookie-done {
  color: #22c55e;
  font-size: 0.8rem;
}

/* Footer */
.sheet-footer {
  border-top: 1px solid var(--surface-border);
  padding: 0.6rem 0.75rem;
  flex-shrink: 0;
}

.add-profile-form {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.add-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 0.75rem;
  background: none;
  border: 1.5px dashed var(--surface-border);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;
}

.add-profile-btn:active {
  background: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--primary-color);
}

.add-confirm-btn,
.add-cancel-btn {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.add-confirm-btn {
  background: var(--primary-color);
  color: #fff;
}

.add-cancel-btn {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
}

/* ─── Sheet transition ───────────────────────────────────────── */

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .profile-sheet,
.sheet-leave-active .profile-sheet {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .profile-sheet,
.sheet-leave-to .profile-sheet {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .network-tile,
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .profile-sheet,
  .sheet-leave-active .profile-sheet,
  .friends-toggle-pill,
  .toggle-thumb {
    transition: none;
  }
}
</style>
