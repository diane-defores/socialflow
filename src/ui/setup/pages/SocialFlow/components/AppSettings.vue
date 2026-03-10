<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    header="Paramètres" 
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
  >
    <div class="settings-container">
      <!-- Theme Toggle -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-moon mr-2"></i>
          <span>Mode sombre</span>
        </div>
        <InputSwitch v-model="isDarkMode" @change="toggleTheme" />
      </div>

      <Divider />

      <!-- Grayscale / focus mode -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-palette mr-2"></i>
          <span>Mode focus (niveaux de gris)</span>
        </div>
        <InputSwitch :modelValue="themeStore.grayscaleEnabled" @change="themeStore.setGrayscale(!themeStore.grayscaleEnabled)" />
      </div>

      <Divider />

      <!-- Other settings -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-bell mr-2"></i>
          <span>Notifications</span>
        </div>
        <InputSwitch v-model="notifications" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import Divider from 'primevue/divider'

const visible = ref(false)
const notifications = ref(true)

const themeStore = useThemeStore()
const isDarkMode = ref(themeStore.isDarkMode)

const toggleTheme = () => {
  themeStore.toggleTheme()
}

defineExpose({
  show: () => visible.value = true
})
</script>

<style scoped>
.settings-container {
  padding: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.setting-label i {
  margin-right: 0.5rem;
}
</style> 