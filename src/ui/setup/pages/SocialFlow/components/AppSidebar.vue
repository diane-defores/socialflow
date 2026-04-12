<template>
  <template v-if="modelValue">
    <Splitter 
      ref="splitterRef" 
      @resizeend="handleResizeEnd"
      @resize="handleResize"
    >
      <SplitterPanel 
        :size="panelSize" 
        :minSize="5" 
        class="sidebar"
        :class="{ 'icons-only': iconsOnly }"
      >
        <div class="sidebar-content" :class="{ 'content-centered': iconsOnly }">
          <!-- Profile switcher (global — one profile = all networks) -->
          <ProfileSwitcher :iconsOnly="iconsOnly" />

          <div class="flex align-items-center mb-3" :class="{ 'justify-content-center': iconsOnly, 'justify-content-between': !iconsOnly }">
            <Button
              icon="pi pi-arrows-h"
              text
              aria-label="Toggle compact mode"
              @click="toggleIconsOnly"
              v-tooltip.right="'Toggle compact mode'"
            />
          </div>

          <!-- Réseaux sociaux -->
          <div class="menu-section">
            <div class="section-header" v-if="!iconsOnly">
              <h3>{{ $t('sidebar.networks_section') }}</h3>
            </div>
            <div class="menu-items">
              <div v-for="item in menuItems" :key="item.id" class="menu-item-group">
                <div class="network-row" :class="{ active: isNetworkActive(item) }">
                  <Button
                    :icon="hasCustomIcon(item) ? undefined : item.icon"
                    :label="iconsOnly ? undefined : item.label"
                    :tooltip="iconsOnly ? item.label : undefined"
                    :tooltipOptions="{ position: 'right' }"
                    text
                    :class="[
                      'network-btn',
                      iconsOnly ? 'justify-content-center' : 'justify-content-start',
                      { 'network-btn--active': isNetworkActive(item) }
                    ]"
                    @click="navigateToNetwork(item)"
                  >
                    <template v-if="hasCustomIcon(item)" #icon>
                      <ThreadsIcon v-if="item.route === '/threads'" size="1rem" />
                      <SnapchatIcon v-else-if="item.route === '/snapchat'" size="1rem" />
                      <NextdoorIcon v-else-if="item.route === '/nextdoor'" size="1rem" />
                    </template>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtre Amis -->
          <div class="friends-section">
            <div class="section-header" v-if="!iconsOnly">
              <h3>{{ $t('sidebar.friends_section') }}</h3>
              <Button
                icon="pi pi-users"
                text
                size="small"
                :aria-label="$t('friends_filter.manage_button')"
                v-tooltip.right="$t('friends_filter.manage_tooltip')"
                @click="showFriendsPanel = true"
              />
            </div>
            <div class="friends-toggle" :class="{ 'friends-toggle--centered': iconsOnly }">
              <ToggleButton
                :modelValue="filterEnabled"
                @change="setFilterEnabled"
                :onLabel="iconsOnly ? undefined : $t('friends_filter.friends_only')"
                :offLabel="iconsOnly ? undefined : $t('friends_filter.see_all')"
                onIcon="pi pi-filter-fill"
                offIcon="pi pi-filter"
                :pt="{ root: { style: 'width: 100%; border-radius: 0; height: 2.5rem;' } }"
                v-tooltip.right="iconsOnly ? (filterEnabled ? $t('friends_filter.filter_active') : $t('friends_filter.filter_inactive')) : undefined"
              />
              <Button
                v-if="iconsOnly"
                icon="pi pi-users"
                text
                size="small"
                class="friends-manage-btn"
                :aria-label="$t('friends_filter.manage_button')"
                v-tooltip.right="$t('friends_filter.manage_tooltip')"
                @click="showFriendsPanel = true"
              />
            </div>
          </div>

          <FriendsPanel
            v-model="showFriendsPanel"
            :networkId="webviewStore.activeNetworkId ?? 'twitter'"
          />

          <!-- Custom Links -->
          <div class="custom-links-section" v-if="customLinkItems.length || !iconsOnly">
            <div class="section-header" v-if="!iconsOnly">
              <h3>{{ $t('sidebar.custom_links_section') }}</h3>
              <Button
                icon="pi pi-plus"
                text
                size="small"
                :aria-label="$t('links.add_button')"
                v-tooltip.right="$t('links.add_tooltip')"
                @click="showAddLinkDialog = true"
              />
            </div>
            <div class="menu-items" v-if="customLinkItems.length">
              <div v-for="item in customLinkItems" :key="item.id" class="menu-item-group">
                <div class="network-row" :class="{ active: isNetworkActive(item) }">
                  <Button
                    :icon="item.icon"
                    :label="iconsOnly ? undefined : item.label"
                    :tooltip="iconsOnly ? item.label : undefined"
                    :tooltipOptions="{ position: 'right' }"
                    text
                    :class="[
                      'network-btn',
                      iconsOnly ? 'justify-content-center' : 'justify-content-start',
                      { 'network-btn--active': isNetworkActive(item) }
                    ]"
                    @click="navigateToNetwork(item)"
                  />
                  <Button
                    v-if="!iconsOnly"
                    icon="pi pi-times"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    class="custom-link-delete"
                    @click="removeCustomLink(item.route.slice(1))"
                    :aria-label="$t('common.delete')"
                  />
                </div>
              </div>
            </div>
            <Button
              v-if="iconsOnly"
              icon="pi pi-plus"
              text
              size="small"
              class="custom-link-add-icon"
              :aria-label="$t('links.add_button')"
              v-tooltip.right="$t('links.add_tooltip')"
              @click="showAddLinkDialog = true"
            />
          </div>

          <Dialog
            v-model:visible="showAddLinkDialog"
            :header="$t('links.add_dialog_title')"
            :modal="true"
            style="width: 24rem; max-width: 95vw"
          >
            <div class="add-link-form">
              <InputText
                v-model="newLinkLabel"
                :placeholder="$t('links.name_placeholder')"
                class="add-link-input"
                @keydown.enter="addCustomLink"
              />
              <InputText
                v-model="newLinkUrl"
                :placeholder="$t('links.url_placeholder')"
                class="add-link-input"
                @keydown.enter="addCustomLink"
              />
              <Button
                :label="$t('common.add')"
                icon="pi pi-plus"
                :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()"
                @click="addCustomLink"
              />
            </div>
          </Dialog>

          <!-- Kanban Columns -->
          <div class="kanban-section" v-if="!iconsOnly">
            <div class="kanban-columns">
              <div 
                v-for="column in kanbanStore.columns" 
                :key="column.id"
                class="kanban-column"
                @dragover.prevent
                @drop="handleDrop($event, column.id)"
              >
                <div class="column-header">
                  <span class="column-title">{{ $t(column.title) }}</span>
                  <span class="column-count">{{ getColumnItems(column.id).length }}</span>
                </div>
                <div class="column-content">
                  <TransitionGroup name="list" tag="div">
                    <div
                      v-for="item in getColumnItems(column.id)"
                      :key="item.id"
                      class="kanban-item"
                      :class="[
                        `type-${item.type}`,
                        { 'is-dragging': isDragging(item) }
                      ]"
                      draggable="true"
                      @dragstart="handleDragStart($event, item)"
                      @dragend="handleDragEnd"
                    >
                      <div class="item-header">
                        <i :class="getItemIcon(item.type)"></i>
                        <span class="item-title">{{ item.title }}</span>
                        <Button
                          icon="pi pi-times"
                          text
                          rounded
                          size="small"
                          severity="danger"
                          @click="deleteKanbanItem(item.id)"
                        />
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SplitterPanel>
      <SplitterPanel :size="100 - panelSize">
        <slot></slot>
      </SplitterPanel>
    </Splitter>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKanbanStore } from '@/stores/kanban'
import { useWebviewStore } from '@/stores/webviewState'
import { useProfilesStore } from '@/stores/profiles'
import { useFriendsFilterStore } from '@/stores/friendsFilter'
import { useCustomLinksStore } from '@/stores/customLinks'
import type { MenuItem } from '../types'
import type { KanbanItem, KanbanColumnId } from '@/services/kanbanService'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import ToggleButton from 'primevue/togglebutton'
import ProfileSwitcher from './ProfileSwitcher.vue'
import FriendsPanel from './FriendsPanel.vue'
import ThreadsIcon from './icons/ThreadsIcon.vue'
import SnapchatIcon from './icons/SnapchatIcon.vue'
import NextdoorIcon from './icons/NextdoorIcon.vue'

const router = useRouter()
const kanbanStore = useKanbanStore()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()
const filterStore = useFriendsFilterStore()
const customLinksStore = useCustomLinksStore()
const splitterRef = ref()

const showFriendsPanel = ref(false)
const showAddLinkDialog = ref(false)
const newLinkLabel = ref('')
const newLinkUrl = ref('')

const filterEnabled = computed(() => filterStore.enabled)

const setFilterEnabled = () => filterStore.toggle()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'network-selected': [network: MenuItem]
}>()

const iconsOnly = ref(false)
const COMPACT_THRESHOLD = 10

const panelSize = computed(() => {
  return iconsOnly.value ? 5 : 20
})

const totalKanbanItems = computed(() => {
  return kanbanStore.columns.reduce((total, column) => total + column.items.length, 0)
})

const getColumnItems = (columnId: KanbanColumnId) => {
  return kanbanStore.getColumnItems(columnId)
}

const isDragging = (item: KanbanItem) => {
  return kanbanStore.draggedItem?.id === item.id
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'email':
      return 'pi pi-envelope'
    case 'task':
      return 'pi pi-check-square'
    case 'note':
      return 'pi pi-file'
    default:
      return 'pi pi-file'
  }
}

const handleDragStart = (event: DragEvent, item: KanbanItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }
  kanbanStore.startDragging(item)
}

const handleDragEnd = () => {
  kanbanStore.endDragging()
}

const handleDrop = (event: DragEvent, columnId: KanbanColumnId) => {
  const itemId = event.dataTransfer?.getData('text/plain')
  if (itemId) {
    kanbanStore.moveItem(itemId, columnId)
  }
}

const deleteKanbanItem = (itemId: string) => {
  kanbanStore.deleteItem(itemId)
}

const toggleIconsOnly = () => {
  iconsOnly.value = !iconsOnly.value
}

const handleResize = (e: any) => {
  const newSize = e.sizes[0]
  if (newSize <= COMPACT_THRESHOLD && !iconsOnly.value) {
    iconsOnly.value = true
  } else if (newSize > COMPACT_THRESHOLD && iconsOnly.value) {
    iconsOnly.value = false
  }
}

const handleResizeEnd = handleResize

const menuItems = ref<MenuItem[]>([
  { id: 1, label: 'Twitter', icon: 'pi pi-twitter', route: '/twitter' },
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
  { id: 16, label: 'Kanban', icon: 'pi pi-th-large', route: '/kanban' }
])

const customLinkItems = computed<MenuItem[]>(() => {
  const profileId = profilesStore.activeProfileId ?? ''
  return customLinksStore.getLinks(profileId).map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
})

const CUSTOM_ICON_ROUTES = ['/threads', '/snapchat', '/nextdoor']
const hasCustomIcon = (item: MenuItem) => CUSTOM_ICON_ROUTES.includes(item.route)

const isNetworkActive = (item: MenuItem): boolean =>
  webviewStore.activeNetworkId === item.route.slice(1)

const navigateToNetwork = (network: MenuItem): void => {
  const networkId = network.route.slice(1) // '/twitter' → 'twitter'

  if (networkId.startsWith('custom-')) {
    const profileId = profilesStore.activeProfileId ?? ''
    const link = customLinksStore.getLinks(profileId).find(l => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(link.id, link.url)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }

  emit('network-selected', network)
}

const addCustomLink = () => {
  if (!newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  const profileId = profilesStore.activeProfileId ?? ''
  customLinksStore.addLink(profileId, newLinkLabel.value, newLinkUrl.value)
  newLinkLabel.value = ''
  newLinkUrl.value = ''
  showAddLinkDialog.value = false
}

const removeCustomLink = (linkId: string) => {
  const profileId = profilesStore.activeProfileId ?? ''
  customLinksStore.removeLink(profileId, linkId)
}

onMounted(() => {
  kanbanStore.initialize()
})
</script>

<style scoped>
.sidebar {
  background-color: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  height: 100vh;
  margin-top: 4rem;
  transition: all 0.3s;
}

.sidebar.icons-only {
  min-width: 4rem;
  max-width: 4rem;
}

.sidebar:not(.icons-only) {
  min-width: 15rem;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-items {
  width: 100%;
}

.flex.align-items-center.mb-3 {
  padding: 1rem;
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item-group {
  display: flex;
  flex-direction: column;
}

.network-row {
  display: flex;
  align-items: center;
  position: relative;
}

.network-row.active {
  background-color: var(--surface-hover);
  border-left: 3px solid var(--primary-color);
}

.network-btn {
  flex: 1;
  border-radius: 0;
  height: 3rem;
}

.network-btn :deep(.p-button) {
  width: 100%;
  border-radius: 0;
  height: 3rem;
}

.network-btn.justify-content-start :deep(.p-button) {
  padding: 0 1rem;
}

.network-btn.justify-content-center :deep(.p-button) {
  padding: 0;
}

.network-btn :deep(.p-button:hover),
.network-row:hover {
  background-color: var(--surface-hover);
}


.menu-section {
  margin-bottom: 1rem;
}

.section-header {
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.friends-section {
  margin-bottom: 0.5rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.5rem;
}

.friends-toggle {
  display: flex;
  flex-direction: column;
}

.friends-toggle--centered {
  align-items: center;
  padding: 0.25rem 0;
}

.friends-manage-btn {
  margin-top: 0.25rem;
}

.custom-links-section {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.custom-link-delete {
  position: absolute;
  right: 0.25rem;
}

.custom-link-add-icon {
  margin: 0.25rem auto;
  display: block;
}

.add-link-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.add-link-input {
  width: 100%;
}

.kanban-columns {
  padding: 0.5rem;
}

.kanban-column {
  margin-bottom: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.column-header {
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
}

.column-title {
  font-weight: bold;
  font-size: 0.9rem;
}

.column-count {
  background: var(--surface-hover);
  color: var(--text-color);
  padding: 0.1rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.column-content {
  padding: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.kanban-item {
  background: var(--surface-card);
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: move;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.kanban-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kanban-item.is-dragging {
  opacity: 0.5;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-title {
  flex: 1;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-email {
  border-left: 3px solid var(--blue-500);
}

.type-task {
  border-left: 3px solid var(--green-500);
}

.type-note {
  border-left: 3px solid var(--yellow-500);
}

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-active {
  position: absolute;
}

@media (prefers-reduced-motion: reduce) {
  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: none;
  }

  .sidebar,
  .kanban-item {
    transition: none;
  }

  :deep(.p-splitter-panel),
  :deep(.p-splitter-gutter) {
    transition: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    background-color: var(--surface-overlay);
  }
}

.p-splitter {
  border: none;
}

:deep(.p-splitter-gutter) {
  background: var(--surface-border);
  transition: background-color 0.2s;
}

:deep(.p-splitter-gutter:hover) {
  background: var(--primary-color);
}

:deep(.p-splitter-panel) {
  transition: flex-basis 0.3s;
}
</style> 
