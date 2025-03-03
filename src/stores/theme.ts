import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false
  }),
  
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      this.applyTheme()
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    initTheme() {
      // Check if user has a saved preference
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.isDarkMode = savedTheme === 'dark'
      } else {
        // Check system preference
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this.applyTheme()
    }
  }
}) 