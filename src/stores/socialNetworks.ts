import { defineStore } from 'pinia'

interface NetworkConnection {
  networkId: string
  accessToken: string
  username: string
  connected: boolean
}

export const useSocialNetworksStore = defineStore('socialNetworks', {
  state: () => ({
    connections: {} as Record<string, NetworkConnection>
  }),
  
  getters: {
    isConnected: (state) => (networkId: string) => {
      return state.connections[networkId]?.connected || false
    },
    getNetworkInfo: (state) => (networkId: string) => {
      return state.connections[networkId]
    }
  },

  actions: {
    async connectNetwork(networkId: string, authCode: string) {
      try {
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ networkId, authCode })
        })
        
        const data = await response.json()
        this.connections[networkId] = {
          networkId,
          accessToken: data.accessToken,
          username: data.username,
          connected: true
        }
        return true
      } catch (error) {
        console.error('Erreur de connexion:', error)
        return false
      }
    },
    
    disconnectNetwork(networkId: string) {
      delete this.connections[networkId]
    }
  }
}) 