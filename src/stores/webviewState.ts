import { defineStore } from 'pinia'

// Networks that render as native Tauri webviews (bypass X-Frame-Options)
// Gmail is excluded — it uses the existing real API integration
export const WEBVIEW_URLS: Record<string, string> = {
  twitter: 'https://x.com',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  linkedin: 'https://linkedin.com',
  tiktok: 'https://tiktok.com',
  threads: 'https://threads.net',
  discord: 'https://discord.com/app',
  reddit: 'https://reddit.com',
  messenger: 'https://www.messenger.com',
}

export const useWebviewStore = defineStore('webview', {
  state: () => ({
    activeNetworkId: null as string | null,
  }),

  getters: {
    activeUrl: (state): string | null => {
      if (!state.activeNetworkId) return null
      return WEBVIEW_URLS[state.activeNetworkId] ?? null
    },
    usesWebview: () => (networkId: string) => networkId in WEBVIEW_URLS,
  },

  actions: {
    selectNetwork(networkId: string) {
      this.activeNetworkId = networkId
    },
    clearNetwork() {
      this.activeNetworkId = null
    },
  },
})
