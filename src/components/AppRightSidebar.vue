<template>
  <Sidebar
    v-model:visible="visible"
    :base-z-index="1000"
    position="right"
    class="app-right-sidebar"
  >
    <div class="right-sidebar-content">
      <slot></slot>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from 'primevue/sidebar'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<style scoped>
.app-right-sidebar {
  width: 300px;
  height: 100vh;
  padding: 0;
}

.right-sidebar-content {
  height: 100%;
  padding: 1rem;
}

:deep(.p-sidebar) {
  background: var(--surface-card);
  border-left: 1px solid var(--surface-border);
}
</style> 
