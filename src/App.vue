<template>
  <div class="layout-wrapper">
    <AppHeader 
      @toggle-sidebar="toggleSidebar" 
      @filter-change="handleFilterChange"
      :currentNetwork="currentNetwork"
    />
    
    <div class="content-layout">
      <AppSidebar 
        v-model="sidebarVisible"
        @network-selected="selectNetwork"
      />
      
      <main class="main-content">
        <div class="content-wrapper">
          <router-view :network="currentNetwork" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import type { MenuItem } from '@/types'

const sidebarVisible = ref<boolean>(true)
const currentNetwork = ref<MenuItem | null>(null)

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const selectNetwork = (network: MenuItem) => {
  currentNetwork.value = network
}

const handleFilterChange = (filters: any) => {
  console.log('Filtres mis à jour:', filters)
}
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.content-layout {
  display: flex;
  height: calc(100vh - 4rem);
  margin-top: 4rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}
</style> 