import { defineStore } from 'pinia'
import { computed } from 'vue'
import { GmailService } from '@/services/gmailService'
import { gmailConfig } from '@/config/gmail'
import type { Email } from '@/ui/setup/pages/SocialFlow/types'

const OAUTH_CALLBACK_TTL_MS = 5 * 60 * 1000
const consumedOAuthStates = new Map<string, number>()

interface NetworkConnection {
  networkId: string
  accessToken: string
  username: string
  connected: boolean
  userData?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function randomToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function pruneConsumedOAuthStates(now: number) {
  for (const [state, timestamp] of consumedOAuthStates.entries()) {
    if (now - timestamp > OAUTH_CALLBACK_TTL_MS) {
      consumedOAuthStates.delete(state)
    }
  }
}

export const useSocialNetworksStore = defineStore('socialNetworks', {
  state: () => ({
    connections: {} as Record<string, NetworkConnection>,
    gmail: {
      service: new GmailService(gmailConfig),
      emails: [] as Email[],
      initialized: false,
      connected: false,
      unreadCount: 0
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
        const requestState = randomToken()
        const requestNonce = randomToken()
        const startedAt = Date.now()
        const authQuery = new URLSearchParams({ state: requestState, nonce: requestNonce })
        window.dispatchEvent(new CustomEvent('socialflow:android-oauth-request-started', {
          detail: {
            networkId: 'facebook',
            state: requestState,
            nonce: requestNonce,
            startedAtMs: startedAt,
          }
        }))
        const authWindow = window.open(
          `/api/auth/facebook?${authQuery.toString()}`,
          'Facebook Auth',
          'width=600,height=600,scrollbars=yes'
        )
        if (!authWindow) {
          throw new Error('La popup OAuth a été bloquée par le navigateur.')
        }

        return new Promise((resolve, reject) => {
          let settled = false

          const finishWithError = (error: Error) => {
            if (settled) return
            settled = true
            window.removeEventListener('message', onMessage)
            window.removeEventListener('socialflow:android-oauth-callback-validated', onAndroidOAuthCallback)
            window.clearTimeout(timeoutId)
            authWindow.close()
            reject(error)
          }

          const finishWithSuccess = (accessToken: string, user: Record<string, unknown>) => {
            if (settled) return
            settled = true
            window.removeEventListener('message', onMessage)
            window.removeEventListener('socialflow:android-oauth-callback-validated', onAndroidOAuthCallback)
            window.clearTimeout(timeoutId)
            authWindow.close()

            this.connections['facebook'] = {
              networkId: 'facebook',
              accessToken,
              username: String(user.name),
              connected: true,
              userData: user
            }

            resolve(true)
          }

          const acceptOAuthCallback = (payload: Record<string, unknown>) => {
            const now = Date.now()
            pruneConsumedOAuthStates(now)

            if (now - startedAt > OAUTH_CALLBACK_TTL_MS) {
              finishWithError(new Error('Le callback OAuth a expiré. Réessayez la connexion.'))
              return
            }

            const callbackState = payload.state
            const callbackNonce = payload.nonce
            const accessToken = payload.accessToken
            const user = payload.user

            if (typeof callbackState !== 'string' || callbackState !== requestState) {
              finishWithError(new Error('Callback OAuth rejeté: state invalide.'))
              return
            }

            if (consumedOAuthStates.has(callbackState)) {
              finishWithError(new Error('Callback OAuth rejeté: state déjà utilisé (anti-rejeu).'))
              return
            }

            if (callbackNonce !== undefined && callbackNonce !== requestNonce) {
              finishWithError(new Error('Callback OAuth rejeté: nonce invalide.'))
              return
            }

            if (typeof accessToken !== 'string' || accessToken.length === 0) {
              finishWithError(new Error('Callback OAuth rejeté: token manquant.'))
              return
            }

            if (!isRecord(user) || typeof user.name !== 'string' || user.name.length === 0) {
              finishWithError(new Error('Callback OAuth rejeté: profil utilisateur invalide.'))
              return
            }

            consumedOAuthStates.set(callbackState, now)
            finishWithSuccess(accessToken, user)
          }

          const onMessage = (event: MessageEvent<unknown>) => {
            if (event.origin !== window.location.origin) return
            if (event.source !== authWindow) return
            if (!isRecord(event.data)) return
            if (event.data.type !== 'facebook-auth-callback') return
            acceptOAuthCallback(event.data)
          }

          const onAndroidOAuthCallback = (event: Event) => {
            if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') return
            let callbackUrl: URL
            try {
              callbackUrl = new URL(event.detail)
            } catch {
              finishWithError(new Error('Callback OAuth Android rejeté: URL invalide.'))
              return
            }

            acceptOAuthCallback({
              state: callbackUrl.searchParams.get('state') ?? undefined,
              nonce: callbackUrl.searchParams.get('nonce') ?? undefined,
              accessToken:
                callbackUrl.searchParams.get('accessToken')
                ?? callbackUrl.searchParams.get('access_token')
                ?? undefined,
              user: {
                name:
                  callbackUrl.searchParams.get('userName')
                  ?? callbackUrl.searchParams.get('username')
                  ?? 'Facebook',
              },
            })
          }

          const timeoutId = window.setTimeout(() => {
            finishWithError(new Error('Délai OAuth dépassé. Veuillez recommencer.'))
          }, OAUTH_CALLBACK_TTL_MS)

          window.addEventListener('message', onMessage)
          window.addEventListener('socialflow:android-oauth-callback-validated', onAndroidOAuthCallback)
        })
      } catch (error) {
        console.error('Erreur de connexion Facebook:', error)
        return false
      }
    },

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
        this.gmail.unreadCount = this.gmail.emails.filter((email) => !email.isRead).length
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
          this.gmail.unreadCount = this.gmail.emails.filter((item) => !item.isRead).length
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error)
        throw error
      }
    }
  }
})
