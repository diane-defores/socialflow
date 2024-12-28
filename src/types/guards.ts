export interface RouteGuardContext {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}

export interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    role: string
    permissions: string[]
  } | null
} 