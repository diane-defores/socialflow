import { defineStore } from 'pinia'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'
import { useAuth } from '@clerk/vue'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false
  }),

  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      this.applyTheme()
      this.syncThemeToCloud(this.isDarkMode ? 'dark' : 'light')
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    initTheme() {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.isDarkMode = savedTheme === 'dark'
      } else {
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this.applyTheme()
    },

    async syncThemeToCloud(theme: 'light' | 'dark') {
      try {
        const { getToken } = useAuth()
        const client = getConvexClient()
        const token = await getToken({ template: 'convex' })
        if (!token) return
        client.setAuth(token)
        await client.mutation(api.settings.upsert, { theme })
      } catch {
        // Offline — ignore
      }
    },
  }
})
