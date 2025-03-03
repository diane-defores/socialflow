import { defineStore } from 'pinia'

type SocialNetwork = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'threads' | 'discord' | 'reddit' | 'gmail'

interface NetworkState {
  isConnected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  username?: string
}

interface SocialNetworksState {
  networks: Record<SocialNetwork, NetworkState>
}

export const useSocialNetworksStore = defineStore('socialNetworks', {
  state: (): SocialNetworksState => ({
    networks: {
      twitter: { isConnected: false },
      facebook: { isConnected: false },
      instagram: { isConnected: false },
      linkedin: { isConnected: false },
      tiktok: { isConnected: false },
      threads: { isConnected: false },
      discord: { isConnected: false },
      reddit: { isConnected: false },
      gmail: { isConnected: false }
    }
  }),

  getters: {
    isConnected: (state) => (network: SocialNetwork) => {
      return state.networks[network].isConnected
    },

    getNetworkState: (state) => (network: SocialNetwork) => {
      return state.networks[network]
    }
  },

  actions: {
    async connectNetwork(network: SocialNetwork, authCode: string) {
      try {
        // Ici, nous devrions faire un appel API pour échanger le code d'autorisation
        // contre des tokens d'accès. Pour l'instant, on simule juste la connexion.
        this.networks[network] = {
          isConnected: true,
          accessToken: 'fake-token',
          refreshToken: 'fake-refresh-token',
          expiresAt: Date.now() + 3600000, // expire dans 1 heure
          username: `user_${network}`
        }

        // Sauvegarder l'état dans le stockage local
        this.saveToLocalStorage()
      } catch (error) {
        console.error(`Erreur lors de la connexion à ${network}:`, error)
        throw error
      }
    },

    disconnectNetwork(network: SocialNetwork) {
      this.networks[network] = { isConnected: false }
      this.saveToLocalStorage()
    },

    initialize() {
      // Charger l'état depuis le stockage local
      const savedState = localStorage.getItem('social-networks-state')
      if (savedState) {
        this.$patch(JSON.parse(savedState))
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('social-networks-state', JSON.stringify(this.$state))
    }
  }
}) 