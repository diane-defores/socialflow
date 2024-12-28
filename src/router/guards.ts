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

export const authGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.path === '/login') {
    if (authStore.authState.isAuthenticated) {
      next('/twitter')
    } else {
      next()
    }
    return
  }

  if (to.meta.requiresAuth && !authStore.authState.isAuthenticated) {
    next({ name: 'Login' })
    return
  }

  if (to.meta.roles && authStore.authState.user) {
    const hasRequiredRole = (to.meta.roles as string[]).includes(authStore.authState.user.role)
    if (!hasRequiredRole) {
      next({ name: 'Unauthorized' })
      return
    }
  }

  next()
}

export const networkAccessGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.networkId && authStore.authState.user) {
    const networkId = to.meta.networkId as string
    const hasNetworkAccess = authStore.authState.user.permissions.includes(`network:${networkId}`)
    if (!hasNetworkAccess) {
      next({ name: 'NetworkAccessDenied' })
      return
    }
  }
  next()
} 