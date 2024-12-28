<template>
  <Splitter 
    ref="splitterRef" 
    :class="{ 'sidebar-hidden': !modelValue }"
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
        <div class="flex align-items-center mb-3" :class="{ 'justify-content-center': iconsOnly, 'justify-content-between': !iconsOnly }">
          <h2 class="sidebar-title" v-show="!iconsOnly">Social Networks</h2>
          <Button 
            icon="pi pi-arrows-h" 
            text 
            @click="toggleIconsOnly"
            v-tooltip.right="'Toggle compact mode'"
          />
        </div>
        <div class="menu-items">
          <div v-for="item in menuItems" :key="item.id" class="menu-item">
            <Button 
              :icon="item.icon" 
              :label="iconsOnly ? undefined : item.label"
              :tooltip="iconsOnly ? item.label : undefined"
              :tooltipOptions="{ position: 'right' }"
              text
              :class="[
                'w-full',
                iconsOnly ? 'justify-content-center' : 'justify-content-start'
              ]"
              @click="navigateToNetwork(item)"
            />
          </div>
        </div>
      </div>
    </SplitterPanel>
    <SplitterPanel :size="100 - panelSize">
      <slot></slot>
    </SplitterPanel>
  </Splitter>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from '@/types'

const router = useRouter()
const splitterRef = ref()
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
  { id: 5, label: 'TikTok', icon: 'pi pi-video', route: '/tiktok' },
  { id: 6, label: 'Threads', icon: 'pi pi-at', route: '/threads' },
  { id: 7, label: 'Discord', icon: 'pi pi-discord', route: '/discord' },
  { id: 8, label: 'Reddit', icon: 'pi pi-reddit', route: '/reddit' }
])

const navigateToNetwork = (network: MenuItem): void => {
  router.push(network.route)
  emit('network-selected', network)
}
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

.sidebar-hidden {
  transform: translateX(-100%);
}

.sidebar-content {
  height: 100%;
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

.sidebar-title {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item :deep(.p-button) {
  width: 100%;
  border-radius: 0;
  height: 3rem;
}

.menu-item :deep(.p-button.justify-content-start) {
  padding: 0 1rem;
}

.menu-item :deep(.p-button.justify-content-center) {
  padding: 0;
}

.menu-item :deep(.p-button:hover) {
  background-color: var(--surface-hover);
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