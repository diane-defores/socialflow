<template>
  <header class="header">
    <div class="header-content">
      <div class="flex align-items-center w-full gap-3">
        <Button icon="pi pi-bars" @click="emit('toggle-sidebar')" text />
        
        <!-- Filters in the middle - toujours présents -->
        <div class="filters-section flex-grow-1">
          <DashboardFilters 
            :currentNetwork="currentNetwork"
            @filter-change="handleFilterChange"
          />
        </div>

        <div class="profile-section">
          <Avatar 
            image="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            shape="circle" 
            size="large"
            class="cursor-pointer"
            v-ripple
            @click="toggleProfileMenu"
          />
          <Menu ref="profileMenu" :model="profileItems" :popup="true" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import DashboardFilters from './DashboardFilters.vue'

const emit = defineEmits(['toggle-sidebar', 'filter-change'])

const props = defineProps<{
  currentNetwork: any | null
}>()

const profileMenu = ref(null)
const profileItems = ref([
  { label: 'Settings', icon: 'pi pi-cog' },
  { label: 'Profile', icon: 'pi pi-user' },
  { separator: true },
  { label: 'Logout', icon: 'pi pi-power-off' },
])

const toggleProfileMenu = (event) => {
  profileMenu.value.toggle(event)
}

const handleFilterChange = (filters: any) => {
  emit('filter-change', filters)
}

useEventListener(document, 'click', (e) => {
  if (!e.target.closest('.profile-section')) {
    profileMenu.value?.hide()
  }
})
</script>

<style scoped>
.header {
  background-color: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 4rem;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

.filters-section {
  min-width: 0; /* Pour permettre la réduction de la largeur */
}

.filters-section :deep(.p-calendar),
.filters-section :deep(.p-multiselect),
.filters-section :deep(.p-dropdown) {
  min-width: unset; /* Permet aux composants de se réduire */
}

.profile-section {
  position: relative;
  margin-left: auto;
}

@media (max-width: 768px) {
  .filters-section {
    display: none; /* Ou créer un menu déroulant pour mobile */
  }
}
</style> 