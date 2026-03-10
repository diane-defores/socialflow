<template>
  <template v-if="modelValue">
    <Splitter 
      ref="splitterRef" 
      @resizeend="handleResizeEnd"
      @resize="handleResize"
    >
      <SplitterPanel :size="100 - panelSize">
        <slot></slot>
      </SplitterPanel>
      <SplitterPanel 
        :size="panelSize" 
        :minSize="5" 
        class="sidebar"
        :class="{ 'icons-only': iconsOnly }"
      >
        <div class="sidebar-content" :class="{ 'content-centered': iconsOnly }">
          <div class="flex align-items-center mb-3" :class="{ 'justify-content-center': iconsOnly, 'justify-content-between': !iconsOnly }">
            <Button 
              icon="pi pi-arrows-h" 
              text 
              @click="toggleIconsOnly"
              v-tooltip.left="'Toggle compact mode'"
            />
          </div>

          <!-- Section profil -->
          <div class="profile-section" v-show="!iconsOnly">
            <Avatar 
              image="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              size="xlarge"
              shape="circle"
            />
            <h3>John Doe</h3>
            <p>847 amis</p>
          </div>

          <!-- Menu principal -->
          <div class="menu-section">
            <Button icon="pi pi-home" :label="iconsOnly ? undefined : 'Fil d\'actualité'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
            <Button icon="pi pi-user" :label="iconsOnly ? undefined : 'Profil'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
            <Button icon="pi pi-users" :label="iconsOnly ? undefined : 'Amis'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
            <Button icon="pi pi-bell" :label="iconsOnly ? undefined : 'Notifications'" :badge="'3'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
            <Button icon="pi pi-bookmark" :label="iconsOnly ? undefined : 'Enregistrements'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
            <Button icon="pi pi-calendar" :label="iconsOnly ? undefined : 'Événements'" text :class="['w-full', iconsOnly ? 'justify-content-center' : 'justify-content-start']" />
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </template>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const splitterRef = ref()
const iconsOnly = ref(false)
const COMPACT_THRESHOLD = 10

const panelSize = computed(() => {
  return iconsOnly.value ? 5 : 20
})

const toggleIconsOnly = () => {
  iconsOnly.value = !iconsOnly.value
}

const handleResize = (e: any) => {
  const newSize = e.sizes[1]
  if (newSize <= COMPACT_THRESHOLD && !iconsOnly.value) {
    iconsOnly.value = true
  } else if (newSize > COMPACT_THRESHOLD && iconsOnly.value) {
    iconsOnly.value = false
  }
}

const handleResizeEnd = handleResize
</script>

<style scoped>
.sidebar {
  background-color: var(--surface-card);
  border-left: 1px solid var(--surface-border);
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
  padding: 1rem;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-section {
  width: 100%;
}

.profile-section {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 1rem;
}

.profile-section h3 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.2rem;
}

.profile-section p {
  color: var(--text-color-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-section :deep(.p-button) {
  height: 3rem;
  position: relative;
}

.menu-section :deep(.p-button.justify-content-start) {
  padding: 0 1rem;
}

.menu-section :deep(.p-button.justify-content-center) {
  padding: 0;
  display: flex;
  align-items: center;
}

.menu-section :deep(.p-button:hover) {
  background-color: var(--surface-hover);
}

.menu-section :deep(.p-badge) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.icons-only .menu-section :deep(.p-badge) {
  right: -0.25rem;
  top: 0;
  transform: scale(0.8);
  min-width: 1.25rem;
  height: 1.25rem;
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

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  :deep(.p-splitter-panel),
  :deep(.p-splitter-gutter) {
    transition: none;
  }
}
</style> 