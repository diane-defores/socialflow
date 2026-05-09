import { defineStore } from 'pinia'
import { builtInSocialNetworks } from '@/config/socialNetworks'

export const WEBVIEW_URLS: Record<string, string> = builtInSocialNetworks.reduce(
  (acc, network) => {
    acc[network.id] = network.url
    return acc
  },
  {} as Record<string, string>,
)

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
