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
  snapchat: 'https://web.snapchat.com',
  quora: 'https://www.quora.com',
  pinterest: 'https://www.pinterest.com',
  // whatsapp: 'https://web.whatsapp.com', // disabled 2026-04-12 — see docs/whatsapp-web-integration.md
  telegram: 'https://web.telegram.org',
  nextdoor: 'https://nextdoor.com',
}

export const useWebviewStore = defineStore('webview', {
  state: () => ({
    activeNetworkId: null as string | null,
    /** Set only for custom links — overrides WEBVIEW_URLS lookup */
    activeCustomUrl: null as string | null,
  }),

  getters: {
    activeUrl: (state): string | null => {
      if (!state.activeNetworkId) return null
      return state.activeCustomUrl ?? WEBVIEW_URLS[state.activeNetworkId] ?? null
    },
    usesWebview: () => (networkId: string) =>
      networkId in WEBVIEW_URLS || networkId.startsWith('custom-'),
  },

  actions: {
    selectNetwork(networkId: string) {
      this.activeNetworkId = networkId
      this.activeCustomUrl = null
    },
    selectCustom(linkId: string, url: string) {
      this.activeNetworkId = linkId
      this.activeCustomUrl = url
    },
    clearNetwork() {
      this.activeNetworkId = null
      this.activeCustomUrl = null
    },
  },
})
