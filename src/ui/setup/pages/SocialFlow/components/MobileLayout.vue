<template>
  <!-- Webview active: transparent host — the native Kotlin overlay covers everything -->
  <div v-if="webviewStore.activeUrl" class="mobile-webview-screen">
    <NetworkWebviewHost class="mobile-webview-host" />
  </div>

  <!-- Home screen -->
  <div v-else class="mobile-home">

    <!-- Profile card -->
    <div class="profile-card" @click="profileSheetVisible = true">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">
          <img v-if="profilesStore.activeProfile?.avatar" :src="profilesStore.activeProfile.avatar" class="profile-avatar-img" />
          <span v-else>{{ profilesStore.activeProfile?.emoji ?? '👤' }}</span>
        </div>
        <div class="profile-avatar-ring" />
      </div>
      <div class="profile-info">
        <span class="profile-name">{{ profilesStore.activeProfile?.name ?? 'Profil' }}</span>
        <span class="profile-sub">
          <i class="pi pi-th-large" style="font-size:0.65rem; margin-right:0.3rem;" />
          {{ menuItems.length }} réseaux · Appuyer pour gérer
        </span>
        <div class="profile-pills">
          <span v-for="item in menuItems.slice(0, 5)" :key="item.id" class="profile-pill" :style="{ background: pillColor(item.id) }" />
        </div>
      </div>
      <i class="pi pi-chevron-down profile-chevron" />
    </div>

    <!-- Quick actions bar -->
    <div class="quick-actions">
      <!-- Notifications -->
      <button class="quick-action-btn" @click="notificationsVisible = !notificationsVisible">
        <span class="quick-action-icon">
          <i class="pi pi-bell" />
          <span v-if="notificationCount > 0" class="notif-badge">{{ notificationCount }}</span>
        </span>
        <span class="quick-action-label">Notifications</span>
        <i class="pi pi-chevron-right quick-action-arrow" />
      </button>

      <!-- Friends filter toggle -->
      <div class="friends-filter-row">
        <span class="friends-filter-label">
          <i class="pi pi-users" />
          Amis seulement
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
        <span class="notif-title">Notifications</span>
        <button class="notif-clear" @click="notificationCount = 0">Tout lire</button>
      </div>
      <div class="notif-empty">
        <i class="pi pi-bell-slash" />
        <span>Aucune nouvelle notification</span>
      </div>
    </div>

    <!-- Network grid -->
    <div class="networks-section">
      <p class="section-title">Réseaux sociaux</p>
      <div class="network-grid">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="network-tile"
          :class="{ active: isNetworkActive(item) }"
          @click="navigateToNetwork(item)"
        >
          <span class="network-icon-wrap" :style="{ background: networkColors[item.id] }">
            <i :class="item.icon" />
          </span>
          <span class="network-name">{{ item.label }}</span>
        </button>
      </div>
    </div>
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
            <span class="sheet-title">Profils</span>
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
                <span v-if="profile.id === profilesStore.activeProfileId" class="active-label">Actif</span>
              </div>

              <!-- Actions -->
              <div class="sheet-profile-actions">
                <button class="sheet-action" title="Renommer" @click.stop="startEdit(profile)">
                  <i class="pi pi-pencil" />
                </button>
                <button class="sheet-action" title="Photo de profil" @click.stop="pickAvatar(profile.id)">
                  <i class="pi pi-camera" />
                </button>
                <button
                  v-if="profilesStore.profiles.length > 1"
                  class="sheet-action sheet-action--danger"
                  title="Supprimer"
                  @click.stop="deleteProfile(profile.id)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
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
              <span>Nouveau profil</span>
            </button>
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
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import type { Profile } from '@/stores/profiles'
import type { MenuItem } from '../types'
import NetworkWebviewHost from './NetworkWebviewHost.vue'

const router = useRouter()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const filterStore = useFriendsFilterStore()

// ─── Sheet state ──────────────────────────────────────────────
const profileSheetVisible = ref(false)

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

// ─── Notifications ────────────────────────────────────────────
const notificationsVisible = ref(false)
const notificationCount = ref(3)

// ─── Friends filter ───────────────────────────────────────────
const friendsFilterEnabled = computed(() =>
  webviewStore.activeNetworkId ? filterStore.isEnabled(webviewStore.activeNetworkId) : false
)

const toggleFriendsFilter = () => {
  const networkId = webviewStore.activeNetworkId ?? 'global'
  filterStore.setEnabled(networkId, !filterStore.isEnabled(networkId))
}

// ─── Network list ─────────────────────────────────────────────
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

const pillColor = (id: number) => {
  const c = networkColors[id]
  return c.startsWith('linear') ? '#e6683c' : c
}

// ─── Navigation ───────────────────────────────────────────────
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

// ─── Sheet actions ────────────────────────────────────────────
function closeSheet() {
  profileSheetVisible.value = false
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
  overflow-y: auto;
  background: var(--surface-ground);
  padding-top: env(safe-area-inset-top, 24px);
}

/* ─── Profile card ───────────────────────────────────────────── */

.profile-card {
  display: flex;
  align-items: center;
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
  padding: 0 0.75rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
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
