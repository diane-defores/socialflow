<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="$t('common.settings')"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
  >
    <div class="settings-container">
      <!-- Language -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-globe mr-2"></i>
          <span>{{ $t('settings.language') }}</span>
        </div>
        <select v-model="currentLocale" class="locale-select" @change="onLocaleChange">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <Divider />

      <!-- Theme Toggle -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-moon mr-2"></i>
          <span>{{ $t('theme.dark_mode') }}</span>
        </div>
        <InputSwitch v-model="isDarkMode" @change="toggleTheme" />
      </div>

      <Divider />

      <!-- Grayscale / focus mode -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-palette mr-2"></i>
          <span>{{ $t('theme.focus_mode') }}</span>
        </div>
        <InputSwitch :modelValue="themeStore.grayscaleEnabled" @change="themeStore.setGrayscale(!themeStore.grayscaleEnabled)" />
      </div>

      <Divider />

      <!-- Text zoom -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-search-plus mr-2"></i>
          <span>{{ $t('theme.text_zoom') }}</span>
        </div>
        <span class="text-zoom-value">{{ themeStore.textZoom }}%</span>
      </div>
      <div class="text-zoom-slider-row">
        <span class="text-zoom-bound">A</span>
        <input
          type="range"
          min="75"
          max="150"
          step="5"
          :value="themeStore.textZoom"
          class="text-zoom-slider"
          @input="(e: Event) => themeStore.setTextZoom(Number((e.target as HTMLInputElement).value))"
        />
        <span class="text-zoom-bound text-zoom-bound-large">A</span>
      </div>

      <Divider />

      <!-- Other settings -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-bell mr-2"></i>
          <span>{{ $t('common.notifications') }}</span>
        </div>
        <InputSwitch v-model="notifications" />
      </div>

      <Divider />

      <!-- Backup / Restore -->
      <div class="setting-item">
        <div class="setting-label">
          <i class="pi pi-database mr-2"></i>
          <span>{{ $t('backup.section_title') }}</span>
        </div>
      </div>
      <BackupRestore />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/utils/i18n'
import { useThemeStore } from '@/stores/theme'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import Divider from 'primevue/divider'
import BackupRestore from './BackupRestore.vue'

const { locale } = useI18n()

const visible = ref(false)
const notifications = ref(true)
const currentLocale = ref(locale.value)

const themeStore = useThemeStore()
const isDarkMode = ref(themeStore.isDarkMode)

const toggleTheme = () => {
  themeStore.toggleTheme()
}

function onLocaleChange() {
  setLocale(currentLocale.value)
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

.locale-select {
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border, #ddd);
  background: var(--surface-card, #fff);
  color: var(--text-color, #333);
  font-size: 0.85rem;
  cursor: pointer;
}

:global(.dark) .locale-select {
  background: #313244;
  border-color: #45475a;
  color: #cdd6f4;
}

.text-zoom-value {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.text-zoom-slider-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.text-zoom-bound {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.text-zoom-bound-large {
  font-size: 1.15rem;
}

.text-zoom-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-border);
  outline: none;
}

.text-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}
</style>
