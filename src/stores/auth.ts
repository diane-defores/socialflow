import { defineStore } from 'pinia'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    token: null
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated
  },

  actions: {
    async login(email: string, password: string) {
      try {
        // Ici, nous devrions faire un appel API pour authentifier l'utilisateur
        // Pour l'instant, on simule une connexion réussie
        this.user = {
          id: '1',
          username: 'utilisateur_test',
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }
        this.isAuthenticated = true
        this.token = 'fake-jwt-token'

        // Sauvegarder l'état dans le stockage local
        this.saveToLocalStorage()

        return true
      } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        throw error
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        // Ici, nous devrions faire un appel API pour créer un nouvel utilisateur
        // Pour l'instant, on simule une inscription réussie
        this.user = {
          id: '1',
          username,
          email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }
        this.isAuthenticated = true
        this.token = 'fake-jwt-token'

        // Sauvegarder l'état dans le stockage local
        this.saveToLocalStorage()

        return true
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error)
        throw error
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      this.token = null
      localStorage.removeItem('auth-state')
    },

    initialize() {
      // Charger l'état depuis le stockage local
      const savedState = localStorage.getItem('auth-state')
      if (savedState) {
        const { user, isAuthenticated, token } = JSON.parse(savedState)
        this.user = user
        this.isAuthenticated = isAuthenticated
        this.token = token
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('auth-state', JSON.stringify({
        user: this.user,
        isAuthenticated: this.isAuthenticated,
        token: this.token
      }))
    }
  }
}) 