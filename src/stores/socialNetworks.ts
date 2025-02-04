import { defineStore } from 'pinia'
import { computed } from 'vue'
import { GmailService } from '@/services/gmailService'
import { gmailConfig } from '@/config/gmail'
import type { Email } from '@/types'

interface NetworkConnection {
  networkId: string
  accessToken: string
  username: string
  connected: boolean
}

export const useSocialNetworksStore = defineStore('socialNetworks', {
  state: () => ({
    connections: {} as Record<string, NetworkConnection>,
    gmail: {
      service: new GmailService(gmailConfig),
      emails: [] as Email[],
      initialized: false,
      connected: false
    }
  }),
  
  getters: {
    isConnected: (state) => (networkId: string) => {
      if (networkId === 'gmail') {
        return state.gmail.connected
      }
      return state.connections[networkId]?.connected || false
    },
    getNetworkInfo: (state) => (networkId: string) => {
      return state.connections[networkId]
    },
    unreadEmailCount: (state) => computed(() => state.gmail.emails.filter(email => !email.isRead).length)
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
    },

    async connectFacebook() {
      try {
        // Ouvrir la fenêtre d'authentification Facebook
        const authWindow = window.open(
          '/api/auth/facebook',
          'Facebook Auth',
          'width=600,height=600,scrollbars=yes'
        )

        // Écouter le message de retour de l'authentification
        return new Promise((resolve, reject) => {
          window.addEventListener('message', async (event) => {
            if (event.origin !== window.location.origin) return
            
            if (event.data.type === 'facebook-auth-callback') {
              const { accessToken, user } = event.data
              
              // Mettre à jour le store avec les informations de l'utilisateur
              this.connections['facebook'] = {
                networkId: 'facebook',
                accessToken: accessToken,
                username: user.name,
                connected: true,
                userData: user
              }

              authWindow?.close()
              resolve(true)
            }
          }, { once: true })
        })
      } catch (error) {
        console.error('Erreur de connexion Facebook:', error)
        return false
      }
    },

    // Méthode pour récupérer les données de l'utilisateur Facebook
    async fetchFacebookProfile() {
      try {
        const facebookConnection = this.connections['facebook']
        if (!facebookConnection) {
          throw new Error('Pas de connexion Facebook')
        }

        const response = await fetch('/api/facebook/profile', {
          headers: {
            'Authorization': `Bearer ${facebookConnection.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Impossible de récupérer le profil')
        }

        const profileData = await response.json()
        return profileData
      } catch (error) {
        console.error('Erreur lors de la récupération du profil Facebook:', error)
        return null
      }
    },

    // Méthode pour récupérer le flux Facebook
    async fetchFacebookFeed() {
      try {
        const facebookConnection = this.connections['facebook']
        if (!facebookConnection) {
          throw new Error('Pas de connexion Facebook')
        }

        const response = await fetch('/api/facebook/feed', {
          headers: {
            'Authorization': `Bearer ${facebookConnection.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Impossible de récupérer le flux')
        }

        const feedData = await response.json()
        return feedData
      } catch (error) {
        console.error('Erreur lors de la récupération du flux Facebook:', error)
        return []
      }
    },

    async initializeGmail() {
      if (this.gmail.initialized) return

      try {
        await this.gmail.service.init()
        this.gmail.initialized = true
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Gmail:', error)
        throw error
      }
    },

    async connectGmail() {
      try {
        await this.initializeGmail()
        await this.gmail.service.authenticate()
        this.gmail.connected = true
        await this.fetchGmailData()
      } catch (error) {
        console.error('Erreur lors de la connexion à Gmail:', error)
        throw error
      }
    },

    async fetchGmailData() {
      try {
        if (!this.gmail.connected) {
          await this.connectGmail()
        }
        this.gmail.emails = await this.gmail.service.getEmails()
      } catch (error) {
        console.error('Erreur lors de la récupération des emails:', error)
        throw error
      }
    },

    async markEmailAsRead(messageId: string) {
      try {
        await this.gmail.service.markAsRead(messageId)
        const email = this.gmail.emails.find(e => e.id === messageId)
        if (email) {
          email.isRead = true
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error)
        throw error
      }
    }
  }
}) 