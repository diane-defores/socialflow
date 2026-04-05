import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { authGuard, networkAccessGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
    meta: { auth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { auth: false }
  },
  {
    path: '/twitter',
    name: 'Twitter',
    component: () => import('../components/networks/TwitterView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'twitter',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/facebook',
    name: 'Facebook',
    component: () => import('../components/networks/FacebookView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'facebook',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/instagram',
    name: 'Instagram',
    component: () => import('../components/networks/InstagramView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'instagram',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/linkedin',
    name: 'LinkedIn',
    component: () => import('../components/networks/LinkedInView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'linkedin',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/tiktok',
    name: 'TikTok',
    component: () => import('../components/networks/TikTokView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'tiktok',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/threads',
    name: 'Threads',
    component: () => import('../components/networks/ThreadsView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'threads',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/discord',
    name: 'Discord',
    component: () => import('../components/networks/DiscordView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'discord',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/reddit',
    name: 'Reddit',
    component: () => import('../components/networks/RedditView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'reddit',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/snapchat',
    name: 'Snapchat',
    component: () => import('../components/networks/SnapchatView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'snapchat',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/gmail',
    name: 'Gmail',
    component: () => import('../components/networks/GmailView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'gmail',
      roles: ['user', 'admin']
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Ajout des guards globaux
router.beforeEach(authGuard)
router.beforeEach(networkAccessGuard)

export { router }
