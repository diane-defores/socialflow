<template>
  <div class="social-post">
    <div class="post-header">
      <SocialAvatar 
        :user="post.author"
        size="normal"
        shape="circle"
        class="mr-2"
      />
      <div class="post-meta">
        <h3 class="author-name">{{ post.author.name }}</h3>
        <span class="post-date">{{ formatDate(post.date) }}</span>
      </div>
    </div>

    <div class="post-content">
      <p>{{ post.content }}</p>
      <img v-if="post.image" :src="post.image" :alt="post.content" class="post-image" />
    </div>

    <div class="post-actions">
      <Button 
        :icon="'pi pi-heart' + (post.liked ? '-fill' : '')"
        :class="['like-button', { liked: post.liked }]"
        text
        @click="$emit('like', post.id)"
      >
        {{ post.likes }}
      </Button>
      <Button 
        icon="pi pi-comment"
        text
        @click="$emit('comment', post.id)"
      >
        {{ post.comments }}
      </Button>
      <Button 
        icon="pi pi-share-alt"
        text
        @click="$emit('share', post.id)"
      >
        {{ post.shares }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/dateFormatter'
import Button from 'primevue/button'
import SocialAvatar from './SocialAvatar.vue'

interface Author {
  name: string
  avatar: string
}

interface Post {
  id: string
  author: Author
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  date: Date
  liked?: boolean
}

defineProps<{
  post: Post
}>()

defineEmits<{
  (e: 'like', postId: string): void
  (e: 'comment', postId: string): void
  (e: 'share', postId: string): void
}>()
</script>

<style scoped>
.social-post {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.post-meta {
  flex: 1;
}

.author-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.post-date {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.post-content {
  margin-bottom: 1rem;
}

.post-content p {
  margin: 0 0 1rem 0;
  white-space: pre-wrap;
}

.post-image {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.post-actions {
  display: flex;
  gap: 1rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.like-button.liked {
  color: #ff4081;
}
</style> 