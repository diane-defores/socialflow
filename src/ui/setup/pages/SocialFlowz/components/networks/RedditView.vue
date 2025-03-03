<template>
  <div class="reddit-view">
    <template v-if="isConnected">
      <div class="header">
        <SocialNetworkLogo 
          network="reddit"
          size="small"
          class="mr-2"
        />
        <h2>Reddit Feed</h2>
      </div>
      <div class="reddit-content">
        <div class="subreddits-sidebar">
          <h3>Mes Subreddits</h3>
          <div v-for="sub in subreddits" :key="sub.id" class="subreddit-item">
            <Avatar :image="sub.icon" shape="circle" size="normal" />
            <span>r/{{ sub.name }}</span>
            <span class="members">{{ sub.members }}</span>
          </div>
        </div>
        <div class="posts-section">
          <div v-for="i in 5" :key="i" class="post-card">
            <div class="vote-section">
              <Button icon="pi pi-chevron-up" text />
              <span>{{ Math.floor(Math.random() * 1000) }}</span>
              <Button icon="pi pi-chevron-down" text />
            </div>
            <div class="post-content">
              <div class="post-header">
                <span class="subreddit">r/programming</span>
                <span class="post-meta">Posted by u/user{{ i }} • {{ Math.floor(Math.random() * 24) }}h ago</span>
              </div>
              <h3>Post Title #{{ i }}</h3>
              <p>This is a sample post content. Lorem ipsum dolor sit amet...</p>
              <div class="post-actions">
                <Button icon="pi pi-comments" text>
                  {{ Math.floor(Math.random() * 100) }} Comments
                </Button>
                <Button icon="pi pi-share-alt" text>Partager</Button>
                <Button icon="pi pi-bookmark" text>Sauvegarder</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="connect-prompt">
        <SocialNetworkLogo 
          network="reddit"
          size="large"
          class="mb-3"
        />
        <h3>Connectez-vous à Reddit</h3>
        <p>Pour voir votre feed Reddit, vous devez d'abord vous connecter à votre compte.</p>
        <Button 
          icon="pi pi-reddit" 
          label="Se connecter avec Reddit" 
          @click="connectReddit"
          class="p-button-reddit"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { SocialNetworkLogo } from '@/components/common'

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('reddit'))

const subreddits = ref([
  { id: 1, name: 'programming', members: '5.2M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=prog' },
  { id: 2, name: 'webdev', members: '1.1M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=web' },
  { id: 3, name: 'javascript', members: '2.3M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=js' },
  { id: 4, name: 'vuejs', members: '234K', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=vue' },
  { id: 5, name: 'ProgrammerHumor', members: '2.8M', icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=humor' }
])

const connectReddit = () => {
  const authWindow = window.open(
    '/api/auth/reddit',
    'Reddit Auth',
    'width=500,height=600,scrollbars=yes'
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('reddit', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.reddit-view {
  padding: 1rem;
}

.connect-prompt {
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 8px;
}

.connect-prompt h3 {
  margin-bottom: 1rem;
}

.connect-prompt p {
  margin-bottom: 1.5rem;
  color: var(--text-color-secondary);
}

.reddit-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1rem;
}

.subreddits-sidebar {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.subreddit-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.subreddit-item:hover {
  background: var(--surface-hover);
}

.members {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  display: flex;
  gap: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.vote-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color-secondary);
}

.post-content {
  flex: 1;
}

.post-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.subreddit {
  font-weight: bold;
  color: var(--primary-color);
}

.post-meta {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.8rem;
}

:deep(.p-button-reddit) {
  background: #ff4500;
}

:deep(.p-button-reddit:hover) {
  background: #ff5722;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.header h2 {
  margin: 0;
}
</style> 