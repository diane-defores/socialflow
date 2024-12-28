import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { authGuard, networkAccessGuard } from './guards'
import TwitterView from '../components/networks/TwitterView.vue'
import FacebookView from '../components/networks/FacebookView.vue'
import InstagramView from '../components/networks/InstagramView.vue'
import LinkedInView from '../components/networks/LinkedInView.vue'
import TikTokView from '../components/networks/TikTokView.vue'
import ThreadsView from '../components/networks/ThreadsView.vue'
import DiscordView from '../components/networks/DiscordView.vue'
import RedditView from '../components/networks/RedditView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/twitter',
    name: 'Twitter',
    component: TwitterView,
    meta: {
      requiresAuth: true,
      networkId: 'twitter',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/facebook',
    name: 'Facebook',
    component: FacebookView,
    meta: {
      requiresAuth: true,
      networkId: 'facebook',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/instagram',
    name: 'Instagram',
    component: InstagramView,
    meta: {
      requiresAuth: true,
      networkId: 'instagram',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/linkedin',
    name: 'LinkedIn',
    component: LinkedInView,
    meta: {
      requiresAuth: true,
      networkId: 'linkedin',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/tiktok',
    name: 'TikTok',
    component: TikTokView,
    meta: {
      requiresAuth: true,
      networkId: 'tiktok',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/threads',
    name: 'Threads',
    component: ThreadsView,
    meta: {
      requiresAuth: true,
      networkId: 'threads',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/discord',
    name: 'Discord',
    component: DiscordView,
    meta: {
      requiresAuth: true,
      networkId: 'discord',
      roles: ['user', 'admin']
    }
  },
  {
    path: '/reddit',
    name: 'Reddit',
    component: RedditView,
    meta: {
      requiresAuth: true,
      networkId: 'reddit',
      roles: ['user', 'admin']
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Ajout des guards globaux
router.beforeEach(authGuard)
router.beforeEach(networkAccessGuard)

export { router } 