<template>
  <header class="header">
    <div class="header-start">
      <Button
        icon="pi pi-bars"
        text
        aria-label="Toggle left sidebar"
        @click="toggleLeftSidebar"
        v-tooltip.bottom="'Toggle left sidebar'"
      />
      <h1 class="app-title">SocialFlowz</h1>
    </div>

    <div class="header-center">
      <div class="search-container">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText placeholder="Rechercher..." class="search-input" />
        </span>
      </div>
      <div class="filters-container">
        <DashboardFilters 
          :currentNetwork="currentNetwork"
          @filter-change="handleFilterChange"
        />
      </div>
    </div>

    <div class="header-end">
      <Button
        icon="pi pi-bars"
        text
        aria-label="Toggle right sidebar"
        @click="toggleRightSidebar"
        v-tooltip.bottom="'Toggle right sidebar'"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DashboardFilters from './DashboardFilters.vue'
import type { MenuItem } from '../types'

const props = defineProps<{
  sidebarVisible: boolean
  rightSidebarVisible: boolean
}>()

const emit = defineEmits<{
  'update:sidebarVisible': [value: boolean]
  'update:rightSidebarVisible': [value: boolean]
  'filter-change': [filters: any]
}>()

const route = useRoute()
const currentNetwork = computed<MenuItem | null>(() => {
  if (route.path === '/' || route.path === '/login') return null

  const label = String(route.name)
  return {
    id: -1,
    label,
    icon: 'pi pi-globe',
    route: route.path
  }
})

const toggleLeftSidebar = () => {
  emit('update:sidebarVisible', !props.sidebarVisible)
}

const toggleRightSidebar = () => {
  emit('update:rightSidebarVisible', !props.rightSidebarVisible)
}

const handleFilterChange = (filters: any) => {
  emit('filter-change', filters)
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: auto;
  min-height: 4rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  z-index: 1000;
}

.header-start {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
}

.search-container {
  max-width: 300px;
  width: 100%;
  position: relative;
  margin-right: 1rem;
}

.search-container :deep(.p-input-icon-left) {
  width: 100%;
  display: flex;
  align-items: center;
}

.search-container :deep(.p-input-icon-left i) {
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.search-container :deep(.p-inputtext) {
  padding-left: 2.5rem;
  width: 100%;
}

.filters-container {
  flex: 1;
  max-width: 800px;
  display: flex;
  align-items: center;
}

.filters-container :deep(.p-dropdown),
.filters-container :deep(.p-multiselect),
.filters-container :deep(.p-calendar) {
  min-width: unset;
}

.header-end {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .header-center {
    flex-direction: column;
    gap: 1rem;
  }

  .search-container,
  .filters-container {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .header {
    height: 4rem;
    min-height: 4rem;
  }

  .header-center {
    display: none;
  }
}
</style> 
