import { defineStore } from 'pinia'

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: null
  }),

  getters: {
    // Vérifie si l'utilisateur a un rôle spécifique
    hasRole: (state) => (role: string) => {
      return state.user?.role === role
    },

    // Vérifie si l'utilisateur a une permission spécifique
    hasPermission: (state) => (permission: string) => {
      return state.user?.permissions.includes(permission) || false
    },

    // Vérifie si l'utilisateur a accès à un réseau social
    hasNetworkAccess: (state) => (networkId: string) => {
      return state.user?.permissions.includes(`network:${networkId}`) || false
    }
  },

  actions: {
    // Connexion utilisateur
    async login(email: string, password: string) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          throw new Error('Échec de la connexion')
        }

        const data = await response.json()
        this.setAuthState(data.user, data.token)
        return true
      } catch (error) {
        console.error('Erreur de connexion:', error)
        return false
      }
    },

    // Déconnexion utilisateur
    async logout() {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      } finally {
        this.clearAuthState()
      }
    },

    // Met à jour l'état d'authentification
    setAuthState(user: User, token: string) {
      this.isAuthenticated = true
      this.user = user
      this.token = token
      localStorage.setItem('token', token)
    },

    // Efface l'état d'authentification
    clearAuthState() {
      this.isAuthenticated = false
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },

    // Vérifie et restaure la session si un token existe
    async checkAuth() {
      const token = localStorage.getItem('token')
      if (!token) return false

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) throw new Error('Token invalide')

        const data = await response.json()
        this.setAuthState(data.user, token)
        return true
      } catch (error) {
        this.clearAuthState()
        return false
      }
    }
  }
}) 