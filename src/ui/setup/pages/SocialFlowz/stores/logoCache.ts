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
    // Cache valide pendant 7 jours
    CACHE_DURATION: 7 * 24 * 60 * 60 * 1000
  }),

  actions: {
    async getLogoUrl(domain: string): Promise<string> {
      const cachedLogo = this.cache[domain]
      const now = Date.now()

      // Vérifier si le logo est en cache et toujours valide
      if (cachedLogo && (now - cachedLogo.timestamp) < this.CACHE_DURATION) {
        return cachedLogo.logoUrl
      }

      // Construire l'URL Microlink
      const logoUrl = `https://logo.microlink.io/${domain}`
      
      // Mettre à jour le cache
      this.cache[domain] = {
        logoUrl,
        timestamp: now
      }

      return logoUrl
    }
  },

  persist: {
    storage: localStorage,
    paths: ['cache']
  }
}) 