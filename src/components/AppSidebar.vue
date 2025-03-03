<template>
  <Sidebar 
    v-model:visible="modelValue"
    :baseZIndex="1000"
    class="app-sidebar"
  >
    <div class="sidebar-content">
      <slot></slot>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import Sidebar from 'primevue/sidebar'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<style scoped>
.app-sidebar {
  width: 300px;
  height: 100vh;
  padding: 0;
}

.sidebar-content {
  height: 100%;
  padding: 1rem;
}

:deep(.p-sidebar) {
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
}
</style> 