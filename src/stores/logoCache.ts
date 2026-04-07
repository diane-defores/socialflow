import { defineStore } from 'pinia'

interface LogoCache {
  [url: string]: {
    logoUrl: string
    timestamp: number
  }
}

export const useLogoCacheStore = defineStore('logoCache', {
  state: () => ({
    cache: {} as LogoCache,
    CACHE_DURATION: 7 * 24 * 60 * 60 * 1000
  }),

  actions: {
    async getLogoUrl(domain: string): Promise<string> {
      const cachedLogo = this.cache[domain]
      const now = Date.now()

      if (cachedLogo && (now - cachedLogo.timestamp) < this.CACHE_DURATION) {
        return cachedLogo.logoUrl
      }

      const logoUrl = `https://logo.microlink.io/${domain}`

      this.cache[domain] = {
        logoUrl,
        timestamp: now
      }

      return logoUrl
    }
  },

  persist: {
    storage: localStorage,
    pick: ['cache']
  }
})
