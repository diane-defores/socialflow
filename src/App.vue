<template>
  <div class="app-container">
    <AppHeader 
      v-model:sidebar-visible="sidebarVisible"
      v-model:right-sidebar-visible="rightSidebarVisible"
    />
    
    <AppSidebar v-model="sidebarVisible">
      <AppRightSidebar v-model="rightSidebarVisible">
        <router-view></router-view>
      </AppRightSidebar>
    </AppSidebar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppRightSidebar from '@/components/AppRightSidebar.vue'

const sidebarVisible = ref(true)
const rightSidebarVisible = ref(true)

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style>
.app-container {
  height: 100vh;
  overflow: hidden;
}

:root {
  --primary-color: #2196F3;
  --text-color: #495057;
  --text-color-secondary: #6c757d;
  --surface-ground: #f8f9fa;
  --surface-card: #ffffff;
  --surface-border: #dee2e6;
  --surface-hover: #e9ecef;
  --card-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
}

body {
  margin: 0;
  font-family: var(--font-family);
  color: var(--text-color);
  background: var(--surface-ground);
}
</style> 