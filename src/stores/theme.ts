import { defineStore } from 'pinia'
import { syncSettingsPatch } from '@/lib/cloudSettings'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false,
    grayscaleEnabled: false,
  }),

  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      this.applyTheme()
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light')
      this.syncThemeToCloud(this.isDarkMode ? 'dark' : 'light')
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    setGrayscale(enabled: boolean) {
      this.grayscaleEnabled = enabled
      this.applyGrayscale()
      localStorage.setItem('grayscale', enabled ? '1' : '0')
      syncSettingsPatch({ grayscaleEnabled: enabled })
    },

    applyGrayscale() {
      document.documentElement.style.filter = this.grayscaleEnabled ? 'grayscale(1)' : ''
    },

    initTheme() {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.isDarkMode = savedTheme === 'dark'
      } else {
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this.applyTheme()
      this.grayscaleEnabled = localStorage.getItem('grayscale') === '1'
      this.applyGrayscale()
    },

    async syncThemeToCloud(theme: 'light' | 'dark') {
      await syncSettingsPatch({ theme })
    },

    applyCloudPreferences(settings: {
      theme?: 'light' | 'dark'
      grayscaleEnabled?: boolean
      textZoom?: number
      hapticEnabled?: boolean
      tapSoundEnabled?: boolean
    }) {
      if (settings.theme) {
        this.isDarkMode = settings.theme === 'dark'
        localStorage.setItem('theme', settings.theme)
      }
      if (typeof settings.grayscaleEnabled === 'boolean') {
        this.grayscaleEnabled = settings.grayscaleEnabled
        localStorage.setItem('grayscale', settings.grayscaleEnabled ? '1' : '0')
      }
      if (typeof settings.textZoom === 'number') {
        localStorage.setItem('sfz_text_zoom', String(settings.textZoom))
      }
      if (typeof settings.hapticEnabled === 'boolean') {
        localStorage.setItem('sfz_haptic', String(settings.hapticEnabled))
      }
      if (typeof settings.tapSoundEnabled === 'boolean') {
        localStorage.setItem('sfz_tap_sound', String(settings.tapSoundEnabled))
      }
      this.applyTheme()
      this.applyGrayscale()
    },

    resetLocalPreferences() {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.grayscaleEnabled = false
      this.applyTheme()
      this.applyGrayscale()
    },
  }
})
