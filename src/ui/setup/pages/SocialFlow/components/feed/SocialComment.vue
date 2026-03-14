<template>
  <div class="social-comment" :class="{ 'is-reply': isReply }">
    <div class="comment-container">
      <SocialAvatar 
        :user="comment.author"
        size="normal"
      />
      
      <div class="comment-content">
        <div class="comment-bubble">
          <h5 class="author-name">{{ comment.author.name }}</h5>
          <p class="comment-text">{{ comment.content }}</p>
        </div>
        
        <div class="comment-actions">
          <Button 
            :label="likeLabel" 
            :class="{ 'p-button-text-primary': comment.liked }"
            text 
            size="small"
            @click="handleLike"
          />
          <Button 
            :label="$t('common.reply')"
            text 
            size="small"
            @click="handleReply"
          />
          <span class="comment-time">{{ formatDate(comment.timestamp) }}</span>
        </div>

        <div v-if="showLikes && comment.likes > 0" class="likes-count">
          <i class="pi pi-thumbs-up"></i>
          <span>{{ comment.likes }}</span>
        </div>
      </div>

      <Button 
        v-if="showMenu"
        icon="pi pi-ellipsis-h" 
        text 
        rounded
        size="small"
        @click="$emit('menu', $event)"
      />
    </div>

    <div v-if="comment.replies?.length" class="replies-section">
      <div v-if="!showAllReplies && comment.replies.length > 2" class="show-replies">
        <Button 
          :label="$t('comment.show_more_replies', { count: comment.replies.length - 2 })"
          link
          @click="showAllReplies = true"
        />
      </div>

      <TransitionGroup name="reply">
        <SocialComment
          v-for="reply in visibleReplies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          :show-menu="showMenu"
          @like="$emit('like-reply', reply.id)"
          @reply="$emit('reply', reply.id)"
          @menu="$emit('menu-reply', reply.id, $event)"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import SocialAvatar from './SocialAvatar.vue'

const { t } = useI18n()

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  likes: number
  liked?: boolean
  replies?: Comment[]
}

interface Props {
  comment: Comment
  isReply?: boolean
  showMenu?: boolean
  showLikes?: boolean
  maxVisibleReplies?: number
}

const props = withDefaults(defineProps<Props>(), {
  isReply: false,
  showMenu: true,
  showLikes: true,
  maxVisibleReplies: 2
})

const emit = defineEmits<{
  'like': []
  'reply': [commentId: string]
  'menu': [event: MouseEvent]
  'like-reply': [replyId: string]
  'menu-reply': [replyId: string, event: MouseEvent]
}>()

const showAllReplies = ref(false)

const visibleReplies = computed(() => {
  if (!props.comment.replies) return []
  return showAllReplies.value 
    ? props.comment.replies 
    : props.comment.replies.slice(0, props.maxVisibleReplies)
})

const likeLabel = computed(() => {
  return props.comment.liked ? t('comment.unlike') : t('common.like')
})

const formatDate = (timestamp: string) => {
  // Ici vous pouvez utiliser une librairie comme date-fns
  return new Date(timestamp).toLocaleDateString()
}

const handleLike = () => {
  emit('like')
}

const handleReply = () => {
  emit('reply', props.comment.id)
}
</script>

<style scoped>
.social-comment {
  margin-bottom: 1rem;
}

.comment-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.comment-content {
  flex: 1;
  position: relative;
}

.comment-bubble {
  background: var(--surface-ground);
  border-radius: 18px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
}

.author-name {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.comment-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0.5rem;
}

.comment-time {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.likes-count {
  position: absolute;
  right: 0;
  bottom: 0;
  transform: translateY(50%);
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: var(--card-shadow);
}

.likes-count i {
  color: var(--primary-color);
}

.is-reply {
  padding-left: 2.5rem;
}

.replies-section {
  margin-top: 0.5rem;
}

.show-replies {
  padding-left: 3.25rem;
  margin-bottom: 0.5rem;
}

/* Animations */
.reply-enter-active,
.reply-leave-active {
  transition: all 0.3s ease;
}

.reply-enter-from,
.reply-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style> 
