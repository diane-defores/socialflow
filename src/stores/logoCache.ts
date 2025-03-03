import { defineStore } from 'pinia'

interface LogoCacheState {
  logos: Record<string, string>
}

export const useLogoCacheStore = defineStore('logoCache', {
  state: (): LogoCacheState => ({
    logos: {}
  }),

  actions: {
    setLogo(network: string, url: string) {
      this.logos[network] = url
    },

    getLogo(network: string): string | undefined {
      return this.logos[network]
    },

    clearCache() {
      this.logos = {}
    }
  }
}) 