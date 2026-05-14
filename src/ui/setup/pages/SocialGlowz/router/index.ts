import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'

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
    path: '/session-lock',
    name: 'SessionLock',
    component: () => import('../views/SessionLockView.vue'),
    meta: { auth: true, requiresAuth: true, lockScreen: true }
  },
  {
    path: '/twitter',
    name: 'Twitter',
    component: () => import('../components/networks/TwitterView.vue'),
    meta: {
      auth: true,
      requiresAuth: true,
      networkId: 'twitter',

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

    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(authGuard)

export { router }
