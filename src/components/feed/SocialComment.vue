<template>
  <div class="social-comment">
    <SocialAvatar 
      :user="comment.author"
      size="normal"
      shape="circle"
      class="mr-2"
    />
    <div class="comment-content">
      <div class="comment-header">
        <h4 class="author-name">{{ comment.author.name }}</h4>
        <span class="comment-date">{{ formatDate(comment.date) }}</span>
      </div>
      <p class="comment-text">{{ comment.content }}</p>
      <div class="comment-actions">
        <Button 
          :icon="'pi pi-heart' + (comment.liked ? '-fill' : '')"
          :class="['like-button', { liked: comment.liked }]"
          text
          size="small"
          @click="$emit('like', comment.id)"
        >
          {{ comment.likes }}
        </Button>
        <Button 
          icon="pi pi-reply"
          text
          size="small"
          @click="$emit('reply', comment.id)"
        >
          Répondre
        </Button>
      </div>
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

interface Comment {
  id: string
  author: Author
  content: string
  likes: number
  date: Date
  liked?: boolean
}

defineProps<{
  comment: Comment
}>()

defineEmits<{
  (e: 'like', commentId: string): void
  (e: 'reply', commentId: string): void
}>()
</script>

<style scoped>
.social-comment {
  display: flex;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
}

.social-comment:hover {
  background: var(--surface-hover);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.author-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.comment-text {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.like-button.liked {
  color: #ff4081;
}
</style> 