import { useAuthStore } from '@/stores/auth'
import type { NavigationGuard } from 'vue-router'

interface User {
  role: string;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// Pour le développement, on crée un utilisateur fictif
const devUser = {
  id: 'dev-user',
  email: 'dev@example.com',
  role: 'admin',
  permissions: ['network:facebook', 'network:twitter', 'network:linkedin', 'network:reddit'],
  name: 'Dev User'
}

export const authGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore()
  
  // En développement, on simule un utilisateur connecté
  if (!authStore.isAuthenticated) {
    authStore.setAuthState(devUser, 'dev-token')
  }

  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      next('/facebook')
    } else {
      next()
    }
    return
  }

  next()
}

export const networkAccessGuard: NavigationGuard = (to, from, next) => {
  // En développement, on autorise tous les accès
  next()
} 