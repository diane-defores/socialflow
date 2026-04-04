import { defineStore } from 'pinia'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'
import { useAuth } from '@clerk/vue'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false,
    grayscaleEnabled: false,
    textZoom: 100,
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

    setTextZoom(zoom: number) {
      this.textZoom = zoom
      localStorage.setItem('textZoom', String(zoom))
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
      const savedZoom = localStorage.getItem('textZoom')
      if (savedZoom) this.textZoom = Number(savedZoom)
    },

    async syncThemeToCloud(theme: 'light' | 'dark') {
      try {
        const { getToken } = useAuth()
        const client = getConvexClient()
        const tokenFn = getToken.value
        if (typeof tokenFn !== 'function') return
        const token = await tokenFn({ template: 'convex' })
        if (!token) return
        client.setAuth(token)
        await client.mutation(api.settings.upsert, { theme })
      } catch {
        // Offline — ignore
      }
    },
  }
})
