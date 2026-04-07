<template>
  <div class="twitter-view">
    <template v-if="isConnected">
      <div class="header">
        <SocialNetworkLogo 
          network="twitter"
          size="small"
          class="mr-2"
        />
        <h2>Twitter Feed</h2>
      </div>
      <div class="twitter-content">
        <div class="profile-sidebar">
          <h3>{{ $t('twitter.my_profile') }}</h3>
          <div class="profile-card">
            <Avatar :image="profileInfo.avatar" size="xlarge" shape="circle" />
            <h4>{{ profileInfo.name }}</h4>
            <p class="handle">@{{ profileInfo.handle }}</p>
            <div class="stats">
              <div class="stat-item">
                <strong>{{ profileInfo.following }}</strong>
                <span>{{ $t('twitter.following') }}</span>
              </div>
              <div class="stat-item">
                <strong>{{ profileInfo.followers }}</strong>
                <span>{{ $t('twitter.followers') }}</span>
              </div>
            </div>
          </div>
          
          <div class="trends">
            <h3>{{ $t('twitter.trends') }}</h3>
            <div v-for="trend in trends" :key="trend.id" class="trend-item">
              <span class="category">{{ trend.category }}</span>
              <h4>{{ trend.tag }}</h4>
              <span class="tweets">{{ trend.tweets }} {{ $t('twitter.tweets_count') }}</span>
            </div>
          </div>
        </div>

        <div class="tweets-section">
          <div class="compose-tweet">
            <Avatar :image="profileInfo.avatar" size="normal" shape="circle" />
            <div class="compose-input">
              <Textarea 
                v-model="newTweet" 
                :placeholder="$t('twitter.compose_placeholder')"
                :autoResize="true"
                rows="2"
              />
              <div class="compose-actions">
                <div class="tweet-tools">
                  <Button icon="pi pi-image" text rounded />
                  <Button icon="pi pi-video" text rounded />
                  <Button icon="pi pi-list" text rounded />
                  <Button icon="pi pi-smile" text rounded />
                </div>
                <Button 
                  label="Tweeter" 
                  :disabled="!newTweet.length"
                  class="p-button-twitter"
                />
              </div>
            </div>
          </div>

          <div v-for="tweet in tweets" :key="tweet.id" class="tweet-card">
            <Avatar :image="tweet.authorAvatar" size="normal" shape="circle" />
            <div class="tweet-content">
              <div class="tweet-header">
                <span class="author-name">{{ tweet.authorName }}</span>
                <span class="author-handle">@{{ tweet.authorHandle }}</span>
                <span class="tweet-time">· {{ tweet.time }}</span>
              </div>
              <p class="tweet-text">{{ tweet.text }}</p>
              <div class="tweet-actions">
                <Button icon="pi pi-comment" text rounded>
                  {{ tweet.replies }}
                </Button>
                <Button icon="pi pi-refresh" text rounded>
                  {{ tweet.retweets }}
                </Button>
                <Button icon="pi pi-heart" text rounded>
                  {{ tweet.likes }}
                </Button>
                <Button icon="pi pi-share-alt" text rounded />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="connect-prompt">
        <SocialNetworkLogo 
          network="twitter"
          size="large"
          class="mb-3"
        />
        <h3>{{ $t('twitter.connect_title') }}</h3>
        <p>{{ $t('twitter.connect_message') }}</p>
        <Button 
          icon="pi pi-twitter" 
          :label="$t('twitter.connect_button')"
          @click="connectTwitter"
          class="p-button-twitter"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Avatar from 'primevue/avatar'
import { SocialNetworkLogo } from '../common'

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('twitter'))
const newTweet = ref('')

const profileInfo = ref({
  name: 'John Doe',
  handle: 'johndoe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  following: '234',
  followers: '1.2K'
})

const trends = ref([
  { id: 1, category: 'Technologies', tag: '#VueJS', tweets: '24.5K' },
  { id: 2, category: 'France', tag: '#DevWeb', tweets: '15.2K' },
  { id: 3, category: 'Tendances', tag: '#JavaScript', tweets: '125.4K' },
  { id: 4, category: 'Technologies', tag: '#OpenSource', tweets: '32.1K' },
  { id: 5, category: 'Business', tag: '#Tech', tweets: '85.7K' }
])

const tweets = ref([
  {
    id: 1,
    authorName: 'Vue.js',
    authorHandle: 'vuejs',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vue',
    text: 'Vue 3.4 est maintenant disponible ! Découvrez les nouvelles fonctionnalités et améliorations de performances.',
    time: '2h',
    replies: '45',
    retweets: '234',
    likes: '1.2K'
  },
  {
    id: 2,
    authorName: 'TypeScript',
    authorHandle: 'typescript',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ts',
    text: 'TypeScript 5.3 apporte de nouvelles fonctionnalités pour améliorer votre expérience de développement !',
    time: '4h',
    replies: '32',
    retweets: '156',
    likes: '892'
  }
])

const connectTwitter = () => {
  const authWindow = window.open(
    '/api/auth/twitter',
    'Twitter Auth',
    'width=500,height=600,scrollbars=yes'
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('twitter', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.twitter-view {
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

.twitter-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

@media (max-width: 900px) {
  .twitter-content {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
}

.profile-card h4 {
  margin: 1rem 0 0.25rem;
}

.handle {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item strong {
  font-size: 1.1rem;
}

.stat-item span {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.trends {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1rem;
}

.trend-item {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.trend-item:last-child {
  border-bottom: none;
}

.category {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.tweets {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.compose-tweet {
  display: flex;
  gap: 1rem;
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.compose-input {
  flex: 1;
}

.compose-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.tweet-tools {
  display: flex;
  gap: 0.5rem;
}

.tweets-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tweet-card {
  display: flex;
  gap: 1rem;
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1rem;
}

.tweet-content {
  flex: 1;
}

.tweet-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.author-name {
  font-weight: bold;
}

.author-handle, .tweet-time {
  color: var(--text-color-secondary);
}

.tweet-text {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.tweet-actions {
  display: flex;
  justify-content: space-between;
  max-width: 400px;
}

:deep(.p-button-twitter) {
  background: #1da1f2;
}

:deep(.p-button-twitter:hover) {
  background: #1a8cd8;
}

:deep(.p-inputtextarea) {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  field-sizing: content;
}

:deep(.p-inputtextarea:focus) {
  box-shadow: none;
  border: none;
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
