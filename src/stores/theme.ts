import { defineStore } from 'pinia'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'

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
      try {
        const client = getConvexClient()
        await client.mutation(api.settings.upsert, { theme })
      } catch {
        // Offline — ignore
      }
    },
  }
})
