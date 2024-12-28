<template>
  <div class="social-post" :class="networkClass">
    <div class="post-header">
      <SocialAvatar 
        :user="post.author"
        :show-badge="post.author.verified"
        :badge-icon="post.author.type === 'page' ? 'pi pi-check-circle' : undefined"
      />
      <div class="post-meta">
        <div class="author-info">
          <h4>{{ post.author.name }}</h4>
          <small v-if="subtitle">{{ subtitle }}</small>
        </div>
        <div class="post-info">
          <span>{{ formatDate(post.timestamp) }}</span>
          <i v-if="post.privacy" :class="privacyIcon" />
        </div>
      </div>
      <Button 
        icon="pi pi-ellipsis-h" 
        text 
        rounded
        @click="$emit('menu-click', $event)"
      />
    </div>

    <div class="post-content">
      <p v-if="post.content.text" class="content-text" v-html="formatText(post.content.text)" />
      
      <div v-if="post.content.link" class="content-link">
        <a :href="post.content.link.url" target="_blank" rel="noopener">
          <img :src="post.content.link.thumbnail" :alt="post.content.link.title" />
          <div class="link-info">
            <h5>{{ post.content.link.title }}</h5>
            <p>{{ post.content.link.description }}</p>
          </div>
        </a>
      </div>

      <div v-if="post.content.images" class="content-images" :class="imageLayoutClass">
        <img 
          v-for="(image, index) in post.content.images" 
          :key="index"
          :src="image"
          @click="$emit('image-click', { image, index })"
        />
      </div>

      <div v-if="post.content.video" class="content-video">
        <video controls>
          <source :src="post.content.video" type="video/mp4">
        </video>
      </div>
    </div>

    <div class="post-stats">
      <div class="reactions" v-if="showReactions">
        <div class="reaction-icons">
          <i v-for="(count, type) in post.stats.reactions" 
             :key="type"
             :class="reactionIcon(type)"
             v-show="count > 0"
          />
        </div>
        <span>{{ totalReactions }}</span>
      </div>
      <div class="interaction-stats">
        <span v-if="post.stats.comments">{{ post.stats.comments }} commentaires</span>
        <span v-if="post.stats.shares">{{ post.stats.shares }} partages</span>
      </div>
    </div>

    <div class="post-actions">
      <slot name="actions">
        <Button 
          :icon="primaryActionIcon" 
          :label="primaryActionLabel"
          text
          class="flex-1"
          @click="$emit('primary-action')"
        />
        <Button 
          icon="pi pi-comment" 
          label="Commenter"
          text
          class="flex-1"
          @click="$emit('comment')"
        />
        <Button 
          icon="pi pi-share-alt" 
          label="Partager"
          text
          class="flex-1"
          @click="$emit('share')"
        />
      </slot>
    </div>

    <div v-if="showComments" class="post-comments">
      <slot name="comments" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import SocialAvatar from './SocialAvatar.vue'

interface Props {
  post: {
    author: {
      name: string
      type?: 'user' | 'page'
      verified?: boolean
    }
    content: {
      text?: string
      images?: string[]
      video?: string
      link?: {
        url: string
        title: string
        description: string
        thumbnail: string
      }
    }
    stats: {
      reactions?: Record<string, number>
      comments: number
      shares: number
    }
    timestamp: string
    privacy?: 'public' | 'friends' | 'private'
  }
  network?: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  subtitle?: string
  showComments?: boolean
  showReactions?: boolean
  primaryActionIcon?: string
  primaryActionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  network: 'facebook',
  showComments: false,
  showReactions: true,
  primaryActionIcon: 'pi pi-thumbs-up',
  primaryActionLabel: "J'aime"
})

const emit = defineEmits<{
  'primary-action': []
  'comment': []
  'share': []
  'menu-click': [event: MouseEvent]
  'image-click': [{ image: string, index: number }]
}>()

const networkClass = computed(() => `network-${props.network}`)

const imageLayoutClass = computed(() => {
  const count = props.post.content.images?.length || 0
  return `layout-${count}`
})

const privacyIcon = computed(() => {
  switch (props.post.privacy) {
    case 'public': return 'pi pi-globe'
    case 'friends': return 'pi pi-users'
    case 'private': return 'pi pi-lock'
    default: return ''
  }
})

const totalReactions = computed(() => {
  if (!props.post.stats.reactions) return 0
  return Object.values(props.post.stats.reactions).reduce((a, b) => a + b, 0)
})

const reactionIcon = (type: string) => {
  switch (type) {
    case 'like': return 'pi pi-thumbs-up reaction-like'
    case 'love': return 'pi pi-heart reaction-love'
    case 'care': return 'pi pi-heart-fill reaction-care'
    case 'haha': return 'pi pi-smile reaction-haha'
    case 'wow': return 'pi pi-exclamation-circle reaction-wow'
    case 'sad': return 'pi pi-frown reaction-sad'
    case 'angry': return 'pi pi-times-circle reaction-angry'
    default: return ''
  }
}

const formatDate = (timestamp: string) => {
  // Ici vous pouvez utiliser une librairie comme date-fns pour formater la date
  return new Date(timestamp).toLocaleDateString()
}

const formatText = (text: string) => {
  // Convertit les URLs en liens
  const urlRegex = /(https?:\/\/[^\s]+)/g
  text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')

  // Convertit les hashtags en liens
  const hashtagRegex = /#(\w+)/g
  text = text.replace(hashtagRegex, '<a href="/hashtag/$1">#$1</a>')

  // Convertit les mentions en liens
  const mentionRegex = /@(\w+)/g
  text = text.replace(mentionRegex, '<a href="/user/$1">@$1</a>')

  // Convertit les retours à la ligne en <br>
  return text.replace(/\n/g, '<br>')
}
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
  gap: 1rem;
  margin-bottom: 1rem;
}

.post-meta {
  flex: 1;
}

.author-info h4 {
  margin: 0;
  line-height: 1.2;
}

.post-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.content-text {
  white-space: pre-line;
  margin-bottom: 1rem;
}

.content-text :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.content-text :deep(a):hover {
  text-decoration: underline;
}

.content-link {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.content-link a {
  text-decoration: none;
  color: inherit;
}

.content-link img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.link-info {
  padding: 1rem;
}

.link-info h5 {
  margin: 0 0 0.5rem;
}

.link-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.content-images {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.content-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.layout-1 {
  grid-template-columns: 1fr;
}

.layout-2 {
  grid-template-columns: 1fr 1fr;
}

.layout-3, .layout-4 {
  grid-template-columns: repeat(2, 1fr);
}

.content-video {
  margin-bottom: 1rem;
}

.content-video video {
  width: 100%;
  border-radius: 8px;
}

.post-stats {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.reactions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reaction-icons {
  display: flex;
  gap: 0.25rem;
}

.reaction-icons i {
  font-size: 1.1rem;
}

.interaction-stats {
  display: flex;
  gap: 1rem;
}

.post-actions {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.post-comments {
  padding-top: 1rem;
}

/* Styles spécifiques aux réseaux */
.network-facebook :deep(.reaction-like) { color: #2078f4; }
.network-facebook :deep(.reaction-love) { color: #f33e58; }
.network-facebook :deep(.reaction-care) { color: #f33e58; }
.network-facebook :deep(.reaction-haha) { color: #f7b125; }
.network-facebook :deep(.reaction-wow) { color: #f7b125; }
.network-facebook :deep(.reaction-sad) { color: #f7b125; }
.network-facebook :deep(.reaction-angry) { color: #e9710f; }

.network-twitter {
  /* Styles spécifiques à Twitter */
}

.network-linkedin {
  /* Styles spécifiques à LinkedIn */
}

.network-instagram {
  /* Styles spécifiques à Instagram */
}
</style> 